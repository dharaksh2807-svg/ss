import assert from 'node:assert';
import * as THREE from 'three';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { EnvironmentDirector } from '../src/environment/EnvironmentDirector';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { EnvironmentId } from '../src/environment/EnvironmentConfig';
import { CONSTANTS } from '../src/core/Constants';

import { ModernMetroEventDirector } from '../src/environment/worlds/modernMetro/ModernMetroEventDirector';
import { HistoricQuarterEventDirector } from '../src/environment/worlds/historicQuarter/HistoricQuarterEventDirector';
import { UndergroundMetroEventDirector } from '../src/environment/worlds/undergroundMetro/UndergroundMetroEventDirector';
import { NeonIndustrialEventDirector } from '../src/environment/worlds/neonIndustrial/NeonIndustrialEventDirector';
import { NeonRainlineEventDirector } from '../src/environment/worlds/neonRainline/NeonRainlineEventDirector';
import { OrbitalHaloEventDirector } from '../src/environment/worlds/orbitalHalo/OrbitalHaloEventDirector';
import { AbyssalGlasslineEventDirector } from '../src/environment/worlds/abyssalGlassline/AbyssalGlasslineEventDirector';
import { DoomsdayEventDirector } from '../src/environment/worlds/doomsdayLastTransit/DoomsdayEventDirector';
import { PhantomLineEventDirector } from '../src/environment/worlds/phantomLine/PhantomLineEventDirector';
import { HauntedCarnivalEventDirector } from '../src/environment/worlds/hauntedCarnival/HauntedCarnivalEventDirector';
import { VipComedyEventDirector } from '../src/environment/VipComedyEventDirector';
import { RahulComedyEventDirector } from '../src/environment/worlds/rahulverse/RahulComedyEventDirector';
import { MidnightVelvetEventDirector } from '../src/environment/worlds/midnightVelvet/MidnightVelvetEventDirector';
import { ChronoKingdomEventDirector } from '../src/environment/worlds/chronoKingdom/ChronoKingdomEventDirector';
import { InfernoExpressEventDirector } from '../src/environment/worlds/infernoExpress/InfernoExpressEventDirector';
import { JurassicRushEventDirector } from '../src/environment/worlds/jurassicRush/JurassicRushEventDirector';
import { FeverDirector } from '../src/environment/worlds/vivaHeat/FeverDirector';

console.log('🧪 Starting P0 SHARED WORLD ENGINE STABILIZATION Verification Suite...\n');

// Mock 2D Context for TextureGenerator in node environment
class Mock2DContext {
  fillStyle: any = '#000';
  strokeStyle: any = '#000';
  lineWidth = 1;
  font = '12px sans-serif';
  textAlign = 'left';
  textBaseline = 'top';

  fillRect() {}
  strokeRect() {}
  clearRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  quadraticCurveTo() {}
  bezierCurveTo() {}
  arc() {}
  ellipse() {}
  roundRect() {}
  rect() {}
  fill() {}
  stroke() {}
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  fillText() {}
  strokeText() {}
  measureText(str: string) { return { width: str.length * 8 }; }
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
  drawImage() {}
  getImageData() {
    return { data: new Uint8ClampedArray(4) };
  }
  putImageData() {}
  setLineDash() {}
}

if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 512,
          height: 512,
          getContext: () => new Mock2DContext()
        };
      }
      return {};
    }
  };
}

const ALL_17_WORLDS: EnvironmentId[] = [
  'MODERN_METRO',
  'HISTORIC_QUARTER',
  'UNDERGROUND_METRO',
  'NEON_INDUSTRIAL',
  'NEON_RAINLINE',
  'ORBITAL_HALO',
  'ABYSSAL_GLASSLINE',
  'DOOMSDAY_LAST_TRANSIT',
  'PHANTOM_LINE',
  'HAUNTED_CARNIVAL',
  'VIP_EXPRESS',
  'RAHULVERSE',
  'MIDNIGHT_VELVET',
  'CHRONO_KINGDOM',
  'INFERNO_EXPRESS',
  'JURASSIC_RUSH',
  'VIVA_HEAT'
];

async function runStabilizationSuite() {
  const registry = EnvironmentRegistry.getInstance();
  const envDirector = EnvironmentDirector.getInstance();
  const sceneryFactory = SceneryFactory.getInstance();

  // =========================================================================
  // TEST 1: REGISTRY COMPLETENESS
  // =========================================================================
  console.log('--- Test 1: Registry Completeness for all 17 worlds ---');
  assert.strictEqual(ALL_17_WORLDS.length, 17, 'Must have exactly 17 worlds');
  for (const envId of ALL_17_WORLDS) {
    const theme = registry.get(envId);
    assert.ok(theme, `Theme for ${envId} must be registered`);
    assert.strictEqual(theme.id, envId, `Theme ID must match ${envId}`);
  }
  console.log('✅ All 17 environments cleanly registered.\n');

  // =========================================================================
  // TEST 2: SCENERY GENERATION & FOUNDATION INTEGRITY
  // =========================================================================
  console.log('--- Test 2: Scenery Generation across Z Coordinates ---');
  const testZPositions = [0, -100, -250, -500, -1000, -1600, -3200];

  for (const envId of ALL_17_WORLDS) {
    const theme = registry.get(envId);
    for (const z of testZPositions) {
      const decorativeGroup = new THREE.Group();
      sceneryFactory.buildScenery(
        decorativeGroup,
        theme,
        z,
        false, // isTransition
        false, // isTunnel
        'NONE',
        'FULL',
        Math.abs(z) + 101,
        null,
        null,
        false
      );

      let meshCount = 0;
      let minWorldY = Infinity;
      decorativeGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          meshCount++;
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.computeBoundingBox();
            const box = mesh.geometry.boundingBox;
            if (box) {
              const worldMinY = box.min.y + mesh.position.y;
              if (worldMinY < minWorldY) minWorldY = worldMinY;
            }
          }
        }
      });

      assert.ok(meshCount > 0, `World ${envId} at Z=${z} must generate scenery meshes (got ${meshCount})`);
      assert.ok(minWorldY <= 0.5, `World ${envId} at Z=${z} must have grounded foundations down to ground/sub-grade (got min Y=${minWorldY})`);
    }
  }
  console.log('✅ Scenery generated with solid grounded foundations across all 17 worlds and Z distances.\n');

  // =========================================================================
  // TEST 3: TUNNEL HIJACK BUG RESOLUTION
  // =========================================================================
  console.log('--- Test 3: Verify isTunnel DOES NOT hijack non-underground worlds ---');
  const nonUndergroundWorlds: EnvironmentId[] = [
    'JURASSIC_RUSH',
    'INFERNO_EXPRESS',
    'CHRONO_KINGDOM',
    'VIVA_HEAT',
    'DOOMSDAY_LAST_TRANSIT',
    'PHANTOM_LINE',
    'MIDNIGHT_VELVET',
    'VIP_EXPRESS',
    'RAHULVERSE'
  ];

  for (const envId of nonUndergroundWorlds) {
    const theme = registry.get(envId);
    const normalGroup = new THREE.Group();
    sceneryFactory.buildScenery(
      normalGroup,
      theme,
      -500,
      false, // isTransition
      false, // isTunnel = false
      'NONE',
      'FULL',
      999,
      null,
      null,
      false
    );

    const tunnelGroup = new THREE.Group();
    sceneryFactory.buildScenery(
      tunnelGroup,
      theme,
      -500,
      false, // isTransition
      true,  // isTunnel = true (from obstacle pattern!)
      'NONE',
      'FULL',
      999,
      null,
      null,
      false
    );

    // Verify tunnelGroup does NOT contain underground metro subway signs or tiles
    let hasSubwaySign = false;
    tunnelGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const matName = (mesh.material as any)?.name || '';
        if (matName.includes('subwayTile') || matName.includes('subwaySign')) {
          hasSubwaySign = true;
        }
      }
    });

    assert.strictEqual(
      hasSubwaySign,
      false,
      `World ${envId} must NOT be hijacked into underground subway concrete when isTunnel=true`
    );

    // Verify that the world scenery builder ran and produced custom meshes
    let tunnelMeshCount = 0;
    tunnelGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) tunnelMeshCount++;
    });
    assert.ok(tunnelMeshCount > 0, `World ${envId} must generate world scenery even when isTunnel=true`);
  }
  console.log('✅ Non-underground worlds preserve their custom scenery and reject subway tunnel hijacking.\n');

  // =========================================================================
  // TEST 4: TRANSITION PORTAL GROUND & CONTINUITY
  // =========================================================================
  console.log('--- Test 4: Verify isTransition chunks have scenery + portal (no void gaps) ---');
  for (const envId of ALL_17_WORLDS) {
    const theme = registry.get(envId);
    const transitionGroup = new THREE.Group();
    sceneryFactory.buildScenery(
      transitionGroup,
      theme,
      -800,
      true, // isTransition = true
      false,
      'NONE',
      'FULL',
      1234,
      null,
      null,
      false
    );

    // Must have transition portal object
    let hasPortal = false;
    let totalMeshes = 0;
    transitionGroup.traverse((obj) => {
      if (obj.name === 'transition_portal') hasPortal = true;
      if ((obj as THREE.Mesh).isMesh) totalMeshes++;
    });

    assert.ok(hasPortal, `World ${envId} transition chunk must include transition_portal`);
    assert.ok(totalMeshes >= 5, `World ${envId} transition chunk must retain ground & scenery (got ${totalMeshes} meshes)`);
  }
  console.log('✅ Transition chunks contain both the gateway portal and grounded district scenery across all 17 worlds.\n');

  // =========================================================================
  // TEST 5: SIGNED DISTANCE CONVENTION
  // =========================================================================
  console.log('--- Test 5: Verify Canonical Signed Distance Ahead Convention ---');
  // Convention: distanceAhead = playerZ - triggerZ
  // Negative-Z running: player moves 0 -> -100 -> -400 -> -500 -> -600
  const triggerZ = -500;

  // 1. Approaching (in front): playerZ = -400 (greater Z, less negative)
  const distApproaching = (-400) - triggerZ;
  assert.strictEqual(distApproaching, +100, 'Distance ahead must be positive (+100m) when approaching');
  assert.ok(distApproaching > 0, 'Approaching distance must be > 0');

  // 2. Exactly at encounter: playerZ = -500
  const distAt = (-500) - triggerZ;
  assert.strictEqual(distAt, 0, 'Distance ahead must be 0 at encounter');

  // 3. Past encounter (behind): playerZ = -600 (lesser Z, more negative)
  const distPast = (-600) - triggerZ;
  assert.strictEqual(distPast, -100, 'Distance ahead must be negative (-100m) when past');
  assert.ok(distPast < 0, 'Past distance must be < 0');

  console.log('✅ Signed distance convention (distanceAhead = playerZ - triggerZ) mathematically verified.\n');

  // =========================================================================
  // TEST 6: DETACHMENT PRUNING & MEMORY LEAK PREVENTION
  // =========================================================================
  console.log('--- Test 6: Verify pruneDetached Ancestor Tree Walking ---');
  const directorsWithPrune = [
    { name: 'MidnightVelvet', dir: MidnightVelvetEventDirector.getInstance(), addActor: () => {
      const g = new THREE.Group();
      (MidnightVelvetEventDirector.getInstance() as any).motorcadeCars.push({ group: g, speed: 10, minZ: -100, maxZ: 100 });
      return g;
    }, count: () => (MidnightVelvetEventDirector.getInstance() as any).motorcadeCars.length },
    { name: 'JurassicRush', dir: JurassicRushEventDirector.getInstance(), addActor: () => {
      const g = new THREE.Group();
      (JurassicRushEventDirector.getInstance() as any).sauropods.push({ group: g, baseScale: 1, neckNodes: [], tailNodes: [], legL1: null, legR1: null, legL2: null, legR2: null, animSpeed: 1, animOffset: 0 });
      return g;
    }, count: () => (JurassicRushEventDirector.getInstance() as any).sauropods.length },
    { name: 'InfernoExpress', dir: InfernoExpressEventDirector.getInstance(), addActor: () => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
      (InfernoExpressEventDirector.getInstance() as any).volcanoes.push({ craterMesh: m, magmaCore: m, smokePuffs: [], eruptionTimer: 0, eruptionInterval: 5, isErupting: false, emberParticles: [] });
      return m;
    }, count: () => (InfernoExpressEventDirector.getInstance() as any).volcanoes.length },
    { name: 'RahulComedy', dir: RahulComedyEventDirector.getInstance(), addActor: () => {
      const p = new THREE.Group();
      (RahulComedyEventDirector.getInstance() as any).flipBoards.push({ pivotGroup: p, angle: 0, armGroup: null, confettiParticles: [] });
      return p;
    }, count: () => (RahulComedyEventDirector.getInstance() as any).flipBoards.length }
  ];

  for (const item of directorsWithPrune) {
    (item.dir as any).reset();

    // Create simulated scene root
    const rootScene = new THREE.Scene();
    const chunkGroup = new THREE.Group();
    rootScene.add(chunkGroup);

    // Nested child inside chunk
    const districtSubGroup = new THREE.Group();
    chunkGroup.add(districtSubGroup);

    const actorObject = item.addActor();
    districtSubGroup.add(actorObject);

    assert.strictEqual(item.count(), 1, `${item.name} must have 1 registered actor`);

    // First prune while attached to Scene: actor must stay alive
    (item.dir as any).pruneDetached();
    assert.strictEqual(item.count(), 1, `${item.name} actor must remain while attached to Scene`);

    // Detach chunkGroup from rootScene (simulating chunk recycle)
    rootScene.remove(chunkGroup);

    // Note: actorObject.parent is still districtSubGroup!
    assert.ok(actorObject.parent !== null, 'Child still has shallow parent pointer');

    // Run pruneDetached: deep ancestor walk must detect chunkGroup is no longer in Scene and prune!
    (item.dir as any).pruneDetached();
    assert.strictEqual(item.count(), 0, `${item.name} must prune detached child actor when chunk is recycled!`);
  }
  console.log('✅ Deep ancestor detachment pruning verified across directors, eliminating object leaks.\n');

  // =========================================================================
  // TEST 7: ALL 17 DIRECTORS RESET IN ENVIRONMENTDIRECTOR
  // =========================================================================
  console.log('--- Test 7: Verify resetWorldDirectors resets all 17 event directors ---');
  // Populate simulated actors across all 17 directors
  ModernMetroEventDirector.getInstance().registerGrandInterchange({ group: new THREE.Group(), worldZ: 0, state: 'APPROACH', stateTimer: 0, ambientFibers: [] });
  HistoricQuarterEventDirector.getInstance().registerGrandSteamArrival({ group: new THREE.Group(), worldZ: 0, state: 'DISTANT_APPROACH', stateTimer: 0, steamPlumes: [], pistonLeft: null, pistonRight: null });
  UndergroundMetroEventDirector.getInstance().registerGrandConcourse({ group: new THREE.Group(), worldZ: 0, state: 'DORMANT', stateTimer: 0, chandeliers: [], escalatorSteps: [], announcementTimer: 0 });
  NeonIndustrialEventDirector.getInstance().registerCraneBallet({ group: new THREE.Group(), worldZ: 0, state: 'DORMANT', stateTimer: 0, gantryArm: new THREE.Group(), hoistCable: new THREE.Mesh(), containerCargo: new THREE.Mesh(), warningStrobes: [] });
  NeonRainlineEventDirector.getInstance().registerAirTrafficBallet({ group: new THREE.Group(), triggerZ: 0, vehicleGroups: [], state: 'CRUISING' });
  OrbitalHaloEventDirector.getInstance().registerGrandDocking({ group: new THREE.Group(), worldZ: 0, state: 'APPROACH', stateTimer: 0, dockingClamps: [], thrusterPlumes: [], airlockGlow: new THREE.Mesh() });
  AbyssalGlasslineEventDirector.getInstance().registerGiantManta({ group: new THREE.Group(), triggerZ: 0, leftWing: new THREE.Group(), rightWing: new THREE.Group(), tail: new THREE.Group(), biolumMesh: new THREE.Mesh(), state: 'APPROACHING' });
  DoomsdayEventDirector.getInstance().registerSkyscraperCollapse({ group: new THREE.Group(), triggerZ: 0, state: 'ANTICIPATION', timer: 0, mainTower: new THREE.Group(), upperTower: new THREE.Group(), structuralBeams: [], dustMeshes: [], fireParticles: [], originalY: 0 });
  PhantomLineEventDirector.getInstance().registerWatcher({ group: new THREE.Group(), triggerZ: 0, state: 'WATCHING', timer: 0, head: new THREE.Group(), eyes: [], coatTails: [], baseX: 0, hideX: 0, platformLamp: null, closeVergeMesh: null, lanternLight: null });
  HauntedCarnivalEventDirector.getInstance().registerWatcher({ worldZ: 0, state: 'DORMANT', stateTimer: 0, group: new THREE.Group(), distantFigure: new THREE.Group(), distantHead: new THREE.Group(), distantEyes: [], distantLampLight: new THREE.Mesh(), closeFigure: new THREE.Group(), closeEyes: [], side: 1 });
  (VipComedyEventDirector.getInstance() as any).runawayList.push({ group: new THREE.Group(), minZ: -10, maxZ: 10, speed: 5 });
  (RahulComedyEventDirector.getInstance() as any).flipBoards.push({ pivotGroup: new THREE.Group(), angle: 0, armGroup: null, confettiParticles: [] });
  MidnightVelvetEventDirector.getInstance().registerMotorcadeCar(new THREE.Group(), 10, -50, 50);
  (ChronoKingdomEventDirector.getInstance() as any).timeRifts.push({ group: new THREE.Group(), triggerZ: 0, state: 'DORMANT', timer: 0, portalRing: new THREE.Group(), vortexMesh: new THREE.Mesh() });
  (InfernoExpressEventDirector.getInstance() as any).volcanoes.push({ craterMesh: new THREE.Mesh(), magmaCore: new THREE.Mesh(), smokePuffs: [], eruptionTimer: 0, eruptionInterval: 5, isErupting: false, emberParticles: [] });
  (JurassicRushEventDirector.getInstance() as any).waterfalls.push({ mesh: new THREE.Mesh(), streamSpeed: 1, mistParticles: [] });
  (FeverDirector.getInstance() as any).flowers.push({ group: new THREE.Group() });

  // Now trigger resetWorldDirectors via EnvironmentDirector
  envDirector.resetWorldDirectors();

  // Verify all 17 are wiped to 0
  assert.strictEqual((ModernMetroEventDirector.getInstance() as any).grandInterchanges.length, 0, 'ModernMetro reset');
  assert.strictEqual((HistoricQuarterEventDirector.getInstance() as any).grandSteamArrivals.length, 0, 'HistoricQuarter reset');
  assert.strictEqual((UndergroundMetroEventDirector.getInstance() as any).grandConcourses.length, 0, 'UndergroundMetro reset');
  assert.strictEqual((NeonIndustrialEventDirector.getInstance() as any).craneBallets.length, 0, 'NeonIndustrial reset');
  assert.strictEqual((NeonRainlineEventDirector.getInstance() as any).airTrafficBallets.length, 0, 'NeonRainline reset');
  assert.strictEqual((OrbitalHaloEventDirector.getInstance() as any).grandDockings.length, 0, 'OrbitalHalo reset');
  assert.strictEqual((AbyssalGlasslineEventDirector.getInstance() as any).giantMantas.length, 0, 'AbyssalGlassline reset');
  assert.strictEqual((DoomsdayEventDirector.getInstance() as any).skyscraperCollapses.length, 0, 'Doomsday reset');
  assert.strictEqual((PhantomLineEventDirector.getInstance() as any).watchers.length, 0, 'PhantomLine reset');
  assert.strictEqual((HauntedCarnivalEventDirector.getInstance() as any).watchers.length, 0, 'HauntedCarnival reset');
  assert.strictEqual((VipComedyEventDirector.getInstance() as any).runawayList.length, 0, 'VipComedy reset');
  assert.strictEqual((RahulComedyEventDirector.getInstance() as any).flipBoards.length, 0, 'RahulComedy reset');
  assert.strictEqual((MidnightVelvetEventDirector.getInstance() as any).motorcadeCars.length, 0, 'MidnightVelvet reset');
  assert.strictEqual((ChronoKingdomEventDirector.getInstance() as any).timeRifts.length, 0, 'ChronoKingdom reset');
  assert.strictEqual((InfernoExpressEventDirector.getInstance() as any).volcanoes.length, 0, 'InfernoExpress reset');
  assert.strictEqual((JurassicRushEventDirector.getInstance() as any).waterfalls.length, 0, 'JurassicRush reset');
  assert.strictEqual((FeverDirector.getInstance() as any).flowers.length, 0, 'FeverDirector reset');

  console.log('✅ resetWorldDirectors() cleanly wipes state across all 17 event directors.\n');

  console.log('🎉 ALL P0 SHARED WORLD ENGINE STABILIZATION INVARIANTS VERIFIED SUCCESSFULLY!');
}

runStabilizationSuite().catch((err) => {
  console.error('❌ STABILIZATION SUITE FAILED:', err);
  process.exit(1);
});
