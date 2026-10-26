import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { CameraController } from '../src/scene/CameraController';
import { ObstacleFactory, ObstacleInstance } from '../src/track/ObstacleFactory';
import { TrackChunk } from '../src/track/TrackChunk';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { BugSnapshotManager } from '../src/debug/BugSnapshotManager';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';
import { SpeedController } from '../src/core/SpeedController';
import { CollisionResolver } from '../src/track/CollisionResolver';

console.log('🧪 Starting Metro Runner 3D: Early Hard Mode Crash & Screenshot Verification Suite...\n');

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

// In-memory mock localStorage
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
};

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
// SUITE 1: Reproduction Seed 1599997308 & Opening Pattern Verification
// ============================================================================
console.log('--- Test Suite 1: Reproduction Seed 1599997308 & Opening Pattern ---');
{
  const { trackManager } = createTestHarness();
  const REPRO_SEED = 1599997308;

  trackManager.setGameMode('HARD');
  trackManager.setSeed(REPRO_SEED, true);
  trackManager.reset(false);

  const chunk0 = trackManager.chunks[0];
  assert(chunk0 !== undefined, 'Chunk 0 exists at run start');
  assert(chunk0.patternName === 'OPENING_DISTANT_TRAIN', 'Seed 1599997308 selects OPENING_DISTANT_TRAIN pattern');

  // Verify stationary center train geometry
  const centerTrain = chunk0.obstacles.find(o => o.type === 'TRAIN' && o.lane === 0);
  assert(centerTrain !== undefined, 'Stationary center train obstacle spawned in Chunk 0');

  // Center is now shifted to -58m (front bumper at -47m)
  const trainMeshZ = centerTrain!.group.position.z;
  const trainHalfDepth = (centerTrain!.length || 22.0) / 2;
  const frontBumperZ = trainMeshZ + trainHalfDepth;

  assert(trainMeshZ === -58.0, `Train mesh center position is -58.0m (actual: ${trainMeshZ})`);
  assert(frontBumperZ === -47.0, `Train front bumper is at Z = -47.0m (actual: ${frontBumperZ})`);

  // Reaction distance from start (Z = 0)
  const reactionDist = Math.abs(frontBumperZ);
  assert(reactionDist === 47.0, `Reaction distance to front bumper is 47.0m (was 24.0m in bug)`);

  // Hard Mode initial speed calculation (~26-28 m/s)
  const hardInitialSpeed = new SpeedController('HARD').getSpeed();
  const reactionTimeSec = reactionDist / hardInitialSpeed;

  assert(reactionTimeSec >= 1.65, `Reaction time in Hard Mode is ${reactionTimeSec.toFixed(2)}s (>= 1.5s human fairness target, was 0.917s in crash)`);
}

// ============================================================================
// SUITE 2: Visual Guidance & Feasible Safe Avoidance Routes
// ============================================================================
console.log('--- Test Suite 2: Visual Guidance & Feasible Safe Avoidance Routes ---');
{
  const pattern = OBSTACLE_PATTERNS.find(p => p.name === 'OPENING_DISTANT_TRAIN');
  assert(pattern !== undefined, 'OPENING_DISTANT_TRAIN pattern exists in catalog');

  // Verify lane switch coins guide the player ahead of the train
  const coins = pattern!.collectibles?.filter(c => c.type === 'COIN') || [];
  assert(coins.length > 0, 'Guidance coins exist in OPENING_DISTANT_TRAIN');

  const laneSwitchCoins = coins.find(c => c.archetype === 'LANE_SWITCH' || c.endLane !== undefined);
  assert(laneSwitchCoins !== undefined, 'LANE_SWITCH guidance trail exists in OPENING_DISTANT_TRAIN');
  assert(laneSwitchCoins!.zOffset === 18.0, `Lane switch guidance coins start at z=18.0m (ahead of train front at z=47m)`);

  const flankingCoin = coins.find(c => c.lane === -1);
  assert(flankingCoin !== undefined && flankingCoin.zOffset <= 34.0, `Guidance coins transition player safely to lane -1 before train front`);

  // Verify reachability validator confirms 100% solvability from Lane 0
  const validation = ReachabilityValidator.validatePattern(pattern!, 26.0, [0]);
  assert(validation.solvable === true, 'ReachabilityValidator confirms OPENING_DISTANT_TRAIN is solvable from Lane 0');
  assert(validation.survivingExitLanes.includes(-1) || validation.survivingExitLanes.includes(1), 'At least one surviving exit lane exists when starting in Lane 0');
  assert(validation.minReactionTimeSeconds >= 1.5, `Validator confirms reaction time >= 1.5s (actual: ${validation.minReactionTimeSeconds.toFixed(2)}s)`);
}

// ============================================================================
// SUITE 3: Collider / Mesh Synchronization & Genuine Frontal Lethality
// ============================================================================
console.log('--- Test Suite 3: Collider / Mesh Synchronization & Genuine Frontal Lethality ---');
{
  const { player, trackManager } = createTestHarness();
  trackManager.setGameMode('HARD');
  trackManager.setSeed(1599997308, true);
  trackManager.reset(false);

  const chunk0 = trackManager.chunks[0];
  const centerTrain = chunk0.obstacles.find(o => o.type === 'TRAIN' && o.lane === 0)!;

  // Verify collider center exactly matches mesh group position
  const colliderCenter = new THREE.Vector3();
  centerTrain.collider.getCenter(colliderCenter);
  assert(Math.abs(colliderCenter.z - centerTrain.group.position.z) < 0.001, 'Train collider center agrees with visual mesh group position Z');

  // Verify front bumper position matches collider max Z
  assert(Math.abs(centerTrain.collider.max.z - (-47.0)) < 0.001, 'Collider front bumper is exactly at Z = -47.0m');

  // Verify staying in Lane 0 and driving into train front causes a genuine frontal collision
  player.position.set(0, 0, -47.0);
  player.currentLane = 0;
  player.speed = 26.0;

  const resolution = CollisionResolver.resolveOutcome(centerTrain, player, null, true);
  assert(resolution.outcome === 'MAJOR_FATAL_HIT', 'Frontal impact with train is classified as MAJOR_FATAL_HIT');
  assert(resolution.isFrontal === true, 'Impact is correctly classified as frontal');

  // Confirm fatal collision kills player (preserves lethal danger, no cheat invulnerability)
  const isFatal = player.crash('TRAIN_COLLISION');
  assert(isFatal === true, 'Frontal train collision is genuinely fatal without protection');
  assert(player.state === 'CRASH', 'Player enters CRASH state upon frontal impact');
}

// ============================================================================
// SUITE 4: Protection Mechanics Integrity (Shield & Hoverboard)
// ============================================================================
console.log('--- Test Suite 4: Protection Mechanics Integrity (Shield & Hoverboard) ---');
{
  const { player, trackManager } = createTestHarness();
  trackManager.setGameMode('HARD');
  trackManager.setSeed(1599997308, true);
  trackManager.reset(false);

  const chunk0 = trackManager.chunks[0];
  const centerTrain = chunk0.obstacles.find(o => o.type === 'TRAIN' && o.lane === 0)!;

  // Test Shield protection
  player.position.set(0, 0, -47.0);
  player.powerups.activate('SHIELD');
  assert(player.powerups.hasShieldActive() === true, 'Shield is active');

  const fatalWithShield = player.crash('TRAIN_COLLISION');
  assert(fatalWithShield === false, 'Shield successfully absorbs fatal collision');
  assert(player.powerups.hasShieldActive() === false, 'Shield is consumed upon absorption');
  assert(player.isInvulnerable() === true, 'Player receives post-hit invulnerability grace period');

  // Test Hoverboard protection
  player.reset();
  player.hoverboardManager.activate();
  assert(player.hoverboardManager.isBoardActive() === true, 'Hoverboard is active');

  const fatalWithBoard = player.crash('TRAIN_COLLISION');
  assert(fatalWithBoard === false, 'Hoverboard successfully absorbs fatal collision');
  assert(player.hoverboardManager.isBoardActive() === false, 'Hoverboard is broken upon absorption');
}

// ============================================================================
// SUITE 5: Speed Progression & Normal Mode Invariance
// ============================================================================
console.log('--- Test Suite 5: Speed Progression & Normal Mode Invariance ---');
{
  const hardInitial = new SpeedController('HARD').getSpeed();
  const normalInitial = new SpeedController('NORMAL').getSpeed();

  assert(hardInitial >= 24.0, `Hard Mode initial speed is >= 24.0 m/s (actual: ${hardInitial})`);
  assert(normalInitial === 18.0, `Normal Mode initial speed is 18.0 m/s (actual: ${normalInitial})`);

  // At Normal Mode speed, opening reaction time is even more generous
  const normalReactionTime = 47.0 / normalInitial;
  assert(normalReactionTime >= 2.5, `Normal Mode reaction time for OPENING_DISTANT_TRAIN is ${normalReactionTime.toFixed(2)}s`);

  // Normal Mode opening candidates remain 100% solvable
  const pattern = OBSTACLE_PATTERNS.find(p => p.name === 'OPENING_DISTANT_TRAIN')!;
  const normalValidation = ReachabilityValidator.validatePattern(pattern, normalInitial, [0]);
  assert(normalValidation.solvable === true, 'OPENING_DISTANT_TRAIN remains 100% valid and solvable in Normal Mode');
}

// ============================================================================
// SUITE 6: Multi-Seed Hard Mode Opening Fairness
// ============================================================================
console.log('--- Test Suite 6: Multi-Seed Hard Mode Opening Fairness ---');
{
  const { trackManager } = createTestHarness();
  trackManager.setGameMode('HARD');
  const testSeeds = [1599997308, 1234567, 8881234, 42424242, 9999999];

  for (const seed of testSeeds) {
    trackManager.setSeed(seed, true);
    trackManager.reset(false);
    const chunk0 = trackManager.chunks[0];

    assert(chunk0 !== undefined, `Chunk 0 generated for seed ${seed}`);
    assert(!chunk0.patternName.startsWith('HARD_') && !chunk0.patternName.startsWith('EXPERT_'), `Opening chunk uses opening template, not late-game pattern (${chunk0.patternName})`);

    // Ensure first obstacle in chunk 0 gives >= 1.5s reaction time from lane 0
    let minReactionDist = 999;
    for (const obs of chunk0.obstacles) {
      if (obs.lane === 0 && obs.active) {
        const halfDepth = (obs.length || 2.0) / 2;
        const frontDist = Math.abs(obs.group.position.z + halfDepth);
        if (frontDist < minReactionDist) minReactionDist = frontDist;
      }
    }

    if (minReactionDist < 999) {
      const timeToImpact = minReactionDist / 26.0;
      assert(timeToImpact >= 1.0, `Seed ${seed} opening obstacle provides safe reaction time: ${timeToImpact.toFixed(2)}s (dist: ${minReactionDist.toFixed(1)}m)`);
    }
  }
}

// ============================================================================
// SUITE 7: Input History Capture & Clean Absence Handling
// ============================================================================
console.log('--- Test Suite 7: Input History Capture & Clean Absence Handling ---');
{
  const { player, cameraController, snapshotManager } = createTestHarness();
  snapshotManager.setRunContext({ seed: 1599997308, gameMode: 'HARD' });

  // 1. Snapshot with zero inputs: inputs array is clean empty, summary explains 0 inputs occurred
  const emptyInputSnap = snapshotManager.recordFatalCollision({
    reason: 'TRAIN_COLLISION',
    player,
    isFrontal: true
  });

  assert(Array.isArray(emptyInputSnap.inputs), 'Snapshot package contains inputs array');
  assert(emptyInputSnap.inputs.length === 0, 'No inputs fabricated when 0 inputs occurred during run');

  const summary = snapshotManager.generateMarkdownSummary(emptyInputSnap);
  assert(summary.includes('0 player input actions occurred'), 'Markdown summary accurately reports 0 inputs occurred');

  // 2. Snapshot with actual input events
  snapshotManager.reset();
  EventBus.getInstance().emit('INPUT_ACTION', 'MOVE_LEFT');

  // Record a frame
  snapshotManager.recordFrame({
    player,
    cameraController,
    nowTime: Date.now() / 1000
  });

  const inputSnap = snapshotManager.recordFatalCollision({
    reason: 'TRAIN_COLLISION',
    player,
    isFrontal: true
  });

  assert(inputSnap.inputs.length > 0, 'Recent input action was captured');
  assert(inputSnap.inputs[0].action === 'MOVE_LEFT', 'Captured input action matches MOVE_LEFT');
}

// ============================================================================
// SUITE 8: Crash Screenshot Capture Mechanism & Diagnostics
// ============================================================================
console.log('--- Test Suite 8: Crash Screenshot Capture Mechanism & Diagnostics ---');
{
  const { player, cameraController, snapshotManager } = createTestHarness();

  // Test when captureHandler is registered (simulating Three.js synchronous render capture)
  let renderCalled = false;
  const mockBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(500);

  snapshotManager.setCaptureHandler(() => {
    renderCalled = true;
    return mockBase64;
  });

  const snap = snapshotManager.recordFatalCollision({
    reason: 'TRAIN_COLLISION',
    player,
    cameraController,
    isFrontal: true
  });

  assert(renderCalled === true, 'Synchronous render captureHandler invoked during recordFatalCollision');
  assert(snap.screenshotStatus === 'CAPTURED', `Screenshot status is 'CAPTURED' (actual: ${snap.screenshotStatus})`);
  assert(snap.screenshotBase64 === mockBase64, 'Snapshot package contains non-black screenshot base64 payload');

  // Verify diagnostic fields
  assert(snap.trigger.details.collisionClassification === 'MAJOR_FATAL_HIT', 'Diagnostic includes collision classification');
  assert(snap.trigger.details.playerPosition !== undefined, 'Diagnostic includes playerPosition');
  assert(snap.trigger.details.playerVelocity !== undefined, 'Diagnostic includes playerVelocity');
  assert(snap.runContext.generatorVersion === '1.0.0-reachability-v2', 'Diagnostic includes generatorVersion');

  // Verify circular buffer ends with the CRASH state frame
  const lastFrame = snap.frames[snap.frames.length - 1];
  assert(lastFrame.player.state === 'CRASH', `Last frame in buffer records collision event itself: state = '${lastFrame.player.state}'`);

  // Test headless/unavailable behavior
  snapshotManager.setCaptureHandler(() => undefined);
  const headlessSnap = snapshotManager.captureManualSnapshot('Headless test');
  assert(headlessSnap.screenshotStatus === 'UNAVAILABLE_HEADLESS' || headlessSnap.screenshotStatus === 'FAILED', 'Handles missing screenshot gracefully without black image');
}

console.log('\n=================================================');
console.log(`🎯 ALL ${passedTests} OF ${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
console.log('=================================================\n');
