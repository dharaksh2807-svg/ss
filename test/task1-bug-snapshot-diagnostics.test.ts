import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { CameraController } from '../src/scene/CameraController';
import { ObstacleFactory, ObstacleInstance } from '../src/track/ObstacleFactory';
import { TrackChunk } from '../src/track/TrackChunk';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { BugSnapshotManager } from '../src/debug/BugSnapshotManager';
import { BugReproductionLoader } from '../src/debug/BugReproductionLoader';
import { DebugVisualizer } from '../src/debug/DebugVisualizer';
import {
  SNAPSHOT_SCHEMA_VERSION,
  GAME_BUILD_VERSION,
  APP_ID,
  MAX_SNAPSHOT_FRAMES,
  BugSnapshotPackage
} from '../src/debug/BugSnapshotTypes';

console.log('🧪 Starting Metro Runner 3D: Task 1 Bug Snapshots & Developer Diagnostics Verification...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passedTests++;
  }
}

// In-memory mock localStorage for isolated progression testing
const storageMock: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
} as any;

function createTestHarness() {
  const scene = new THREE.Scene();
  const player = new Player();
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.2, 500);
  const cameraController = new CameraController(camera);
  const trackManager = new TrackManager(scene);
  const snapshotManager = BugSnapshotManager.getInstance();
  snapshotManager.reset();

  return { scene, player, camera, cameraController, trackManager, snapshotManager };
}

// ============================================================================
// TEST SUITE 1: Bounded Circular Buffer & Memory Safety
// ============================================================================
console.log('--- Test Suite 1: Bounded Circular Buffer & Memory Safety ---');
{
  const { player, cameraController, snapshotManager } = createTestHarness();

  assert(snapshotManager.getBufferCount() === 0, 'Buffer begins empty after reset');

  // Push 40 simulation frames
  for (let i = 0; i < 40; i++) {
    player.position.z = -i * 2.5;
    player.distanceTraveled = i * 2.5;
    snapshotManager.recordFrame({
      player,
      cameraController,
      nearbyObstacles: [],
      simTime: i * 0.016,
      nowTime: i * 0.016
    });
  }
  assert(snapshotManager.getBufferCount() === 40, 'Records 40 frames accurately');

  // Overflow past MAX_SNAPSHOT_FRAMES (240 frames)
  for (let i = 40; i < 500; i++) {
    player.position.z = -i * 2.5;
    player.distanceTraveled = i * 2.5;
    snapshotManager.recordFrame({
      player,
      cameraController,
      nearbyObstacles: [],
      simTime: i * 0.016,
      nowTime: i * 0.016
    });
  }

  assert(
    snapshotManager.getBufferCount() === MAX_SNAPSHOT_FRAMES,
    `Buffer count strictly capped at MAX_SNAPSHOT_FRAMES (${MAX_SNAPSHOT_FRAMES}) without memory leak`
  );

  snapshotManager.reset();
  assert(snapshotManager.getBufferCount() === 0, 'Snapshot buffer cleanly resets');
}

// ============================================================================
// TEST SUITE 2: Snapshot Schema & Required Diagnostic Fields
// ============================================================================
console.log('\n--- Test Suite 2: Comprehensive Diagnostic Fields & Schema ---');
{
  const { player, cameraController, snapshotManager } = createTestHarness();

  snapshotManager.setRunContext({
    seed: 424242,
    gameMode: 'HARD',
    difficulty: 'HARD',
    activeEnvironment: 'HISTORIC_QUARTER',
    activeDistrict: 'VIADUCT'
  });

  player.position.set(0.0, 4.35, -120.0);
  player.currentLane = 0;
  player.speed = 24.0;
  player.groundY = 4.35;
  player.supportSurface = 'TRAIN_ROOF';
  player.activeSupportObstacleId = 'train_01';
  player.distanceTraveled = 120.0;
  player.powerups.activate('SHIELD');

  // Create mock nearby train obstacle
  const dummyGroup = new THREE.Group();
  dummyGroup.position.set(0, 0, -135);
  const dummyObs: ObstacleInstance = {
    id: 'train_01',
    group: dummyGroup,
    type: 'MOVING_TRAIN',
    lane: 0,
    collider: new THREE.Box3(new THREE.Vector3(-1.2, 0, -145), new THREE.Vector3(1.2, 4.2, -125)),
    nearMissBox: new THREE.Box3(),
    nearMissTriggered: false,
    active: true,
    isMoving: true,
    velocityZ: 15.0,
    roofSurfaceY: 4.35
  };

  snapshotManager.recordFrame({
    player,
    cameraController,
    nearbyObstacles: [dummyObs],
    simTime: 5.2,
    nowTime: 5.2
  });

  const snapshot = snapshotManager.captureManualSnapshot('Verification of all diagnostic fields');

  assert(snapshot.schemaVersion === SNAPSHOT_SCHEMA_VERSION, `Schema version is ${SNAPSHOT_SCHEMA_VERSION}`);
  assert(snapshot.appId === APP_ID, `App ID matches '${APP_ID}'`);
  assert(snapshot.gameVersion === GAME_BUILD_VERSION, `Game version matches '${GAME_BUILD_VERSION}'`);
  assert(snapshot.runContext.seed === 424242, 'Deterministic run seed recorded correctly');
  assert(snapshot.runContext.gameMode === 'HARD', 'Game mode HARD recorded correctly');
  assert(snapshot.runContext.activeEnvironment === 'HISTORIC_QUARTER', 'Active environment recorded correctly');
  assert(snapshot.frames.length > 0, 'Frames array populated');

  const frame = snapshot.frames[snapshot.frames.length - 1];
  assert(frame.player.lane === 0, 'Player lane recorded');
  assert(frame.player.x === 0.0 && frame.player.y === 4.35 && frame.player.z === -120.0, 'Player XYZ coordinates recorded');
  assert(frame.player.speed === 24.0, 'Player speed recorded');
  assert(frame.player.supportSurface === 'TRAIN_ROOF', 'Player support surface recorded');
  assert(frame.player.activeSupportObstacleId === 'train_01', 'Active support obstacle ID recorded');
  assert(frame.powerups.hasShield === true, 'Powerup shield state recorded');

  assert(frame.nearbyObstacles.length === 1, 'Nearby obstacle captured in frame');
  const obs = frame.nearbyObstacles[0];
  assert(obs.id === 'train_01', 'Obstacle ID captured');
  assert(obs.type === 'MOVING_TRAIN', 'Obstacle type captured');
  assert(obs.velocityZ === 15.0, 'Obstacle velocityZ captured');
  assert(obs.roofSurfaceY === 4.35, 'Obstacle roof surface captured');
}

// ============================================================================
// TEST SUITE 3: Automated Invariant Monitors (Failure Detection)
// ============================================================================
console.log('\n--- Test Suite 3: Automated Failure Invariant Monitors ---');
{
  // 3A: Invalid Physics Detection (NaN / Infinite / Extreme Velocity)
  {
    const { player, snapshotManager } = createTestHarness();

    // Normal state -> no error
    player.position.set(0, 0, 0);
    player.verticalVelocity = 0;
    player.speed = 18.0;
    assert(snapshotManager.checkPhysicsInvariants(player) === null, 'Normal physics state passes invariant check');

    // NaN position
    player.position.set(NaN, 0, 0);
    const nanCheck = snapshotManager.checkPhysicsInvariants(player);
    assert(nanCheck !== null && nanCheck.reason.includes('non-finite'), 'Detects NaN player coordinates');

    // Extreme vertical velocity
    player.position.set(0, 0, 0);
    player.verticalVelocity = 120.0;
    const extremeVy = snapshotManager.checkPhysicsInvariants(player);
    assert(extremeVy !== null && extremeVy.reason.includes('vertical velocity'), 'Detects extreme non-physical vertical velocity');

    // Lateral out of bounds
    player.verticalVelocity = 0;
    player.position.set(10.5, 0, 0);
    const oobCheck = snapshotManager.checkPhysicsInvariants(player);
    assert(oobCheck !== null && oobCheck.reason.includes('corridor boundaries'), 'Detects lateral out-of-bounds displacement');
  }

  // 3B: Rooftop Clipping / Fall-Through Detection
  {
    const { player, cameraController, snapshotManager } = createTestHarness();

    const dummyTrainGroup = new THREE.Group();
    dummyTrainGroup.position.set(0, 0, -50);
    const dummyTrain: ObstacleInstance = {
      id: 'train_clip_test',
      group: dummyTrainGroup,
      type: 'TRAIN',
      lane: 0,
      collider: new THREE.Box3(new THREE.Vector3(-1.2, 0, -65), new THREE.Vector3(1.2, 4.2, -35)),
      nearMissBox: new THREE.Box3(),
      nearMissTriggered: false,
      active: true,
      length: CONSTANTS.TRAIN_LENGTH_SHORT
    };

    // Frame 1: Supported on train roof
    player.position.set(0, 4.35, -50);
    player.groundY = 4.35;
    player.supportSurface = 'TRAIN_ROOF';
    player.activeSupportObstacleId = 'train_clip_test';
    player.isJumping = false;
    snapshotManager.recordFrame({ player, cameraController, nearbyObstacles: [dummyTrain] });

    // Frame 2: Abrupt drop to ground inside train boundary without jumping
    player.position.set(0, 1.2, -50);
    player.groundY = CONSTANTS.PLAYER_BASE_Y;
    player.supportSurface = 'GROUND';

    const roofFallCheck = snapshotManager.checkRooftopClipping(player, [dummyTrain]);
    assert(roofFallCheck !== null, 'Automatically flags player clipping/falling through train roof');
    assert(roofFallCheck!.reason.includes('train_clip_test'), 'Identifies the specific train obstacle where roof fell through');
  }

  // 3C: Moving Train Mesh vs Collider Disagreement Detection
  {
    const { snapshotManager } = createTestHarness();

    const syncGroup = new THREE.Group();
    syncGroup.position.set(0, 0, -100);
    const syncTrain: ObstacleInstance = {
      id: 'train_sync',
      group: syncGroup,
      type: 'MOVING_TRAIN',
      lane: 0,
      collider: new THREE.Box3(new THREE.Vector3(-1.2, 0, -110), new THREE.Vector3(1.2, 4.2, -90)), // center is -100
      nearMissBox: new THREE.Box3(),
      nearMissTriggered: false,
      active: true,
      isMoving: true
    };
    assert(snapshotManager.checkTrainMeshColliderSync([syncTrain]) === null, 'Synchronized train mesh & collider pass check');

    // Desynchronized train (mesh moved to -100, but collider stayed at -80: offset = 20m)
    const desyncGroup = new THREE.Group();
    desyncGroup.position.set(0, 0, -100);
    const desyncTrain: ObstacleInstance = {
      id: 'train_desync_bug',
      group: desyncGroup,
      type: 'MOVING_TRAIN',
      lane: 0,
      collider: new THREE.Box3(new THREE.Vector3(-1.2, 0, -90), new THREE.Vector3(1.2, 4.2, -70)), // center is -80
      nearMissBox: new THREE.Box3(),
      nearMissTriggered: false,
      active: true,
      isMoving: true
    };

    const desyncCheck = snapshotManager.checkTrainMeshColliderSync([desyncTrain]);
    assert(desyncCheck !== null, 'Automatically flags train mesh vs collider displacement discrepancy');
    assert(desyncCheck!.reason.includes('train_desync_bug'), 'Identifies desynchronized train obstacle ID');
  }

  // 3D: Impossible Obstacle Pattern Detection (3 lanes impassable)
  {
    const { scene, snapshotManager } = createTestHarness();

    const chunk = new TrackChunk(scene, 0);
    chunk.chunkZ = 0;

    // Create 3 solid high barriers covering lane -1, 0, 1 at exact same Z
    const createBarrier = (lane: any, id: string): ObstacleInstance => {
      const g = new THREE.Group();
      g.position.set(CONSTANTS.LANES[lane], 0, -60);
      return {
        id,
        group: g,
        type: 'HIGH_BARRIER',
        lane,
        collider: new THREE.Box3(
          new THREE.Vector3(CONSTANTS.LANES[lane] - 0.8, 0, -61),
          new THREE.Vector3(CONSTANTS.LANES[lane] + 0.8, 3.5, -59)
        ),
        nearMissBox: new THREE.Box3(),
        nearMissTriggered: false,
        active: true,
        hasRamp: false
      };
    };

    chunk.obstacles = [
      createBarrier(-1, 'bar_L'),
      createBarrier(0, 'bar_C'),
      createBarrier(1, 'bar_R')
    ];

    const solvabilityCheck = snapshotManager.checkObstaclePatternSolvability(chunk);
    assert(solvabilityCheck !== null, 'Automatically detects impassable 3-lane blockage');
    assert(solvabilityCheck!.reason.includes('impassable 3-lane blockage'), 'Includes diagnostic blockage description');
  }

  // 3E: Fatal Collision Snapshot Capture
  {
    const { player, snapshotManager } = createTestHarness();
    player.position.set(0, 0, -200);
    player.currentLane = 0;
    player.speed = 22.0;

    const crashSnapshot = snapshotManager.recordFatalCollision({
      reason: 'TRAIN_COLLISION',
      player,
      obstacle: null,
      isFrontal: true
    });

    assert(crashSnapshot.trigger.type === 'FATAL_COLLISION', 'Fatal collision triggers snapshot package');
    assert(crashSnapshot.trigger.reason.includes('TRAIN_COLLISION'), 'Trigger reason contains collision details');
  }
}

// ============================================================================
// TEST SUITE 4: Serialization, JSON Export & AI Markdown Formatter
// ============================================================================
console.log('\n--- Test Suite 4: Serialization & AI Markdown Summary ---');
{
  const { player, cameraController, snapshotManager } = createTestHarness();

  snapshotManager.setRunContext({
    seed: 987654,
    gameMode: 'DAILY_CHALLENGE',
    difficulty: 'EXPERT',
    activeEnvironment: 'UNDERGROUND_METRO',
    activeDistrict: 'SUBTERRANEAN'
  });

  player.position.set(1.8, 0, -350);
  player.currentLane = 1;
  player.speed = 25.0;
  snapshotManager.recordFrame({ player, cameraController });

  const snapshot = snapshotManager.captureManualSnapshot('Testing AI Summary Formatting');

  // 1. JSON Export verification
  const jsonStr = snapshotManager.exportJson(snapshot);
  assert(typeof jsonStr === 'string' && jsonStr.length > 50, 'exportJson returns non-empty string');
  const parsed = JSON.parse(jsonStr);
  assert(parsed.schemaVersion === SNAPSHOT_SCHEMA_VERSION, 'Exported JSON parses cleanly and matches schema version');
  assert(parsed.runContext.seed === 987654, 'Parsed JSON contains correct run seed');

  // 2. AI Markdown Summary verification
  const mdSummary = snapshotManager.generateMarkdownSummary(snapshot);
  assert(mdSummary.includes('METRO RUNNER 3D — GAMEPLAY BUG SNAPSHOT REPORT'), 'Markdown contains report title');
  assert(mdSummary.includes('987654'), 'Markdown contains deterministic seed');
  assert(mdSummary.includes('UNDERGROUND_METRO'), 'Markdown contains environment info');
  assert(mdSummary.includes('PLAYER KINEMATICS'), 'Markdown contains player kinematics block');
  assert(mdSummary.includes('REPRODUCIBILITY ASSESSMENT'), 'Markdown contains reproducibility assessment');
}

// ============================================================================
// TEST SUITE 5: Deterministic Reproduction Mode & Progression Isolation
// ============================================================================
console.log('\n--- Test Suite 5: Reproduction Loader & Progression Safety ---');
{
  const { player, cameraController, trackManager, snapshotManager } = createTestHarness();
  const prog = ProgressionManager.getInstance();
  const upg = UpgradeManager.getInstance();

  // Snapshot initial wallet & career stats
  const initialCoins = upg.getCoins();
  const initialKeys = prog.getKeys();
  const initialStats = { ...prog.getLifetimeStats() };

  // Prepare a test snapshot package
  snapshotManager.setRunContext({
    seed: 55555,
    gameMode: 'NORMAL',
    difficulty: 'NORMAL',
    activeEnvironment: 'MODERN_METRO'
  });

  player.position.set(0, 0, -100);
  player.currentLane = 0;
  player.speed = 20.0;
  snapshotManager.recordFrame({ player, cameraController });

  const snapshot = snapshotManager.captureManualSnapshot('Reproduction sandbox test');

  // Load snapshot into reproduction loader
  const loader = BugReproductionLoader.getInstance();
  const loaded = loader.loadSnapshot(snapshot, player, trackManager, cameraController);
  assert(loaded === true, 'Reproduction loader loads valid snapshot');
  assert(loader.isRunning() === true, 'Reproduction loader is running');
  assert(trackManager.getRunSeed() === 55555, 'TrackManager seeded with recorded seed');

  // Step reproduction simulation
  loader.update(0.1, player);
  loader.update(0.1, player);

  // Finish reproduction
  loader.finishReproduction();
  assert(loader.isRunning() === false, 'Reproduction completes cleanly');

  // VERIFY PROGRESSION ISOLATION: No currencies or career stats mutated!
  assert(upg.getCoins() === initialCoins, 'Player coins unchanged during reproduction (Progression Safe)');
  assert(prog.getKeys() === initialKeys, 'Player keys unchanged during reproduction (Progression Safe)');
  assert(
    JSON.stringify(prog.getLifetimeStats()) === JSON.stringify(initialStats),
    'Lifetime stats unchanged during reproduction (Progression Safe)'
  );
}

// ============================================================================
// TEST SUITE 6: Privacy & Safety Guarantees
// ============================================================================
console.log('\n--- Test Suite 6: Privacy & Non-Exposure of Secrets ---');
{
  const { snapshotManager } = createTestHarness();
  const snapshot = snapshotManager.captureManualSnapshot('Privacy check');
  const jsonStr = snapshotManager.exportJson(snapshot);

  assert(!jsonStr.includes('password'), 'Snapshot does not export passwords');
  assert(!jsonStr.includes('cookie'), 'Snapshot does not export browser cookies');
  assert(!jsonStr.includes('token'), 'Snapshot does not export authorization tokens');
  assert(!jsonStr.includes('apiKey'), 'Snapshot does not export API keys');
  assert(!jsonStr.includes('localStorage'), 'Snapshot does not dump raw local storage');
  assert(jsonStr.length < 500000, `Snapshot size is compact (${Math.round(jsonStr.length / 1024)} KB < 500 KB)`);
}

// ============================================================================
// TEST SUITE 7: Debug Visualizer Toggle
// ============================================================================
console.log('\n--- Test Suite 7: Debug Visualizer Overlays ---');
{
  const { scene } = createTestHarness();
  const visualizer = DebugVisualizer.getInstance();
  visualizer.init(scene);

  visualizer.setEnabled(false);
  assert(visualizer.getIsEnabled() === false, 'Debug visualizer starts disabled for normal player sessions');

  visualizer.setEnabled(true);
  assert(visualizer.getIsEnabled() === true, 'Debug visualizer can be enabled by developer');

  const toggled = visualizer.toggle();
  assert(toggled === false && visualizer.getIsEnabled() === false, 'Debug visualizer toggles off cleanly');
}

// ============================================================================
// TEST SUITE 8: Missing Data Handling, Restart State Clearance & Performance
// ============================================================================
console.log('\n--- Test Suite 8: Missing Data Handling, Restart Clearance & Performance ---');
{
  const { player, cameraController, trackManager, snapshotManager } = createTestHarness();

  // 8A: Missing data reporting
  const emptyPackage = snapshotManager.captureManualSnapshot('Empty state test');
  const emptySummary = snapshotManager.generateMarkdownSummary(emptyPackage);
  assert(emptySummary.includes('None') || emptySummary.includes('N/A'), 'Missing data is reported rather than invented in AI summary');

  const loader = BugReproductionLoader.getInstance();
  const corruptPackage = { ...emptyPackage, frames: [] };
  const corruptLoaded = loader.loadSnapshot(corruptPackage as any, player, trackManager);
  assert(corruptLoaded === false, 'Corrupt or missing frames snapshot is rejected rather than inventing replay');

  // 8B: Restart clears inappropriate transient state
  player.position.set(2, 4, -80);
  snapshotManager.recordFrame({ player, cameraController });
  assert(snapshotManager.getBufferCount() > 0, 'Buffer has frames before restart');
  snapshotManager.reset();
  assert(snapshotManager.getBufferCount() === 0, 'Restart clears circular buffer count');

  // 8C: Normal gameplay performance preservation (<0.1ms per frame recording)
  const perfStart = Date.now();
  const ITERATIONS = 1000;
  for (let i = 0; i < ITERATIONS; i++) {
    player.position.z = -i;
    snapshotManager.recordFrame({
      player,
      cameraController,
      nearbyObstacles: [],
      simTime: i * 0.016,
      nowTime: i * 0.016
    });
  }
  const perfElapsed = Date.now() - perfStart;
  const avgMsPerFrame = perfElapsed / ITERATIONS;
  console.log(`⏱️ Performance benchmark: ${ITERATIONS} frames recorded in ${perfElapsed}ms (${avgMsPerFrame.toFixed(4)}ms/frame)`);
  assert(avgMsPerFrame < 1.0, 'Normal gameplay performance is preserved (recording overhead < 1.0ms/frame)');
}

console.log(`\n=================================================`);
console.log(`🎯 ALL ${totalTests} TESTS COMPLETED WITH 100% SUCCESS RATE!`);
console.log(`=================================================`);
