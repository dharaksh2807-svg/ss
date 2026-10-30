import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { CameraController } from '../src/scene/CameraController';
import { ChaserModel } from '../src/characters/ChaserModel';
import { CrashReplayManager, FatalCollisionMetadata, DeathExplanation } from '../src/replay/CrashReplayManager';
import { ObstacleInstance, ObstacleType } from '../track/ObstacleFactory';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { ReviveManager } from '../src/revive/ReviveManager';
import { CONSTANTS } from '../src/core/Constants';
import * as THREE from 'three';

console.log('🧪 Starting Metro Runner 3D: Task 1 Instant Crash Replay & Intelligent Death Explanation Tests...\n');

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

// In-memory localStorage mock for node environment
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
  const player = new Player(scene);
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.2, 500);
  const cameraController = new CameraController(camera);
  const chaser = new ChaserModel();
  const trackManager = new TrackManager(scene);
  const replayManager = CrashReplayManager.getInstance();
  replayManager.reset();

  return { scene, player, camera, cameraController, chaser, trackManager, replayManager };
}

// ============================================================================
// TEST SUITE 1: Bounded Circular Buffer & Memory Boundedness
// ============================================================================
console.log('--- Test Suite 1: Bounded Circular Buffer & Memory Safety ---');
{
  const { player, cameraController, replayManager } = createTestHarness();

  assert(replayManager.getBufferCount() === 0, 'Replay buffer starts empty after reset');
  assert(replayManager.hasSufficientReplayData() === false, 'hasSufficientReplayData returns false when empty');

  // Record 50 frames
  for (let i = 0; i < 50; i++) {
    player.position.z = -i * 2;
    replayManager.recordFrame(player, cameraController, [], null, i * 0.016);
  }
  assert(replayManager.getBufferCount() === 50, 'Buffer records 50 frames accurately');
  assert(replayManager.hasSufficientReplayData() === true, 'hasSufficientReplayData returns true with 50 frames');

  // Push total frames to 500 (well past MAX_BUFFER_FRAMES = 240)
  for (let i = 50; i < 500; i++) {
    player.position.z = -i * 2;
    replayManager.recordFrame(player, cameraController, [], null, i * 0.016);
  }

  assert(replayManager.getBufferCount() === CrashReplayManager.MAX_BUFFER_FRAMES,
    `Buffer count strictly capped at MAX_BUFFER_FRAMES (${CrashReplayManager.MAX_BUFFER_FRAMES}) without overflow`);
  
  // Verify reset clears buffer and analysis
  replayManager.reset();
  assert(replayManager.getBufferCount() === 0, 'replayManager.reset() cleanly wipes circular buffer');
  assert(replayManager.getActiveAnalysis() === null, 'replayManager.reset() clears active crash analysis');
}

// ============================================================================
// TEST SUITE 2: Intelligent Death Explanation Classifier
// ============================================================================
console.log('\n--- Test Suite 2: Intelligent Death Reason Explanations ---');
{
  const { replayManager } = createTestHarness();

  // 1. Frontal Moving Train Collision
  const movingFrontalMeta: FatalCollisionMetadata = {
    timestamp: 1000,
    reason: 'MAJOR_FATAL_HIT',
    obstacleType: 'MOVING_TRAIN',
    isFrontal: true,
    isFlankContact: false,
    playerSpeedAtImpact: 22,
    playerStateAtImpact: 'RUN',
    playerLaneAtImpact: 0,
    playerGroundY: 0,
    playerYAtImpact: 0,
    activeProtectionBeforeImpact: { hasShield: false, hasHoverboard: false, isInvulnerable: false }
  };
  const expMovingFrontal = replayManager.generateDeathExplanation(movingFrontalMeta);
  assert(expMovingFrontal.category === 'TRAIN_FRONTAL', 'Moving train head-on categorized as TRAIN_FRONTAL');
  assert(expMovingFrontal.headline.includes('HEAD-ON'), `Moving train headline is clear: "${expMovingFrontal.headline}"`);
  assert(expMovingFrontal.explanation.includes('Hit an oncoming express train head-on'), 'Explanation details head-on moving train collision');

  // 2. Moving Train Flank / Side Swipe
  const movingFlankMeta: FatalCollisionMetadata = {
    ...movingFrontalMeta,
    isFrontal: false,
    isFlankContact: true
  };
  const expMovingFlank = replayManager.generateDeathExplanation(movingFlankMeta);
  assert(expMovingFlank.category === 'TRAIN_FLANK', 'Moving train side swipe categorized as TRAIN_FLANK');
  assert(expMovingFlank.explanation.includes('Sideswiped an oncoming express train'), 'Explanation describes side-swipe contact');

  // 3. Stationary Train Frontal Crash
  const stationaryFrontalMeta: FatalCollisionMetadata = {
    timestamp: 2000,
    reason: 'MAJOR_FATAL_HIT',
    obstacleType: 'TRAIN',
    isFrontal: true,
    isFlankContact: false,
    playerSpeedAtImpact: 16,
    playerStateAtImpact: 'RUN',
    playerLaneAtImpact: -1,
    playerGroundY: 0,
    playerYAtImpact: 0,
    activeProtectionBeforeImpact: { hasShield: false, hasHoverboard: false, isInvulnerable: false }
  };
  const expStationaryFrontal = replayManager.generateDeathExplanation(stationaryFrontalMeta);
  assert(expStationaryFrontal.category === 'TRAIN_FRONTAL', 'Stationary train head-on categorized as TRAIN_FRONTAL');
  assert(expStationaryFrontal.explanation.includes('Crashed directly into a parked metro train'), 'Explanation describes stationary train impact');

  // 4. Low Barrier / Track Hurdle
  const lowBarrierMeta: FatalCollisionMetadata = {
    timestamp: 3000,
    reason: 'MAJOR_FATAL_HIT',
    obstacleType: 'LOW_BARRIER',
    playerSpeedAtImpact: 18,
    playerStateAtImpact: 'RUN',
    playerLaneAtImpact: 1,
    playerGroundY: 0,
    playerYAtImpact: 0,
    activeProtectionBeforeImpact: { hasShield: false, hasHoverboard: false, isInvulnerable: false }
  };
  const expLowBarrier = replayManager.generateDeathExplanation(lowBarrierMeta);
  assert(expLowBarrier.category === 'LOW_BARRIER', 'Low barrier impact categorized as LOW_BARRIER');
  assert(expLowBarrier.explanation.includes('Tripped over a low railway barrier'), 'Accurately explains low hurdle trip');

  // 5. High Barrier / Overhead Arch - Jumped into vs Slide Failure
  const highBarrierJumpMeta: FatalCollisionMetadata = {
    timestamp: 4000,
    reason: 'MAJOR_FATAL_HIT',
    obstacleType: 'HIGH_BARRIER',
    playerSpeedAtImpact: 19,
    playerStateAtImpact: 'JUMP',
    playerLaneAtImpact: 0,
    playerGroundY: 0,
    playerYAtImpact: 1.8,
    activeProtectionBeforeImpact: { hasShield: false, hasHoverboard: false, isInvulnerable: false }
  };
  const expHighJump = replayManager.generateDeathExplanation(highBarrierJumpMeta);
  assert(expHighJump.category === 'HIGH_BARRIER', 'High barrier jump categorized as HIGH_BARRIER');
  assert(expHighJump.headline === 'JUMPED INTO OVERHEAD BARRIER', 'Distinguishes jumping into overhead barrier');
  assert(expHighJump.explanation.includes('Jumped directly into an overhead signal arch'), 'Explains player jumped into barrier');

  const highBarrierRunMeta: FatalCollisionMetadata = {
    ...highBarrierJumpMeta,
    playerStateAtImpact: 'RUN',
    playerYAtImpact: 0
  };
  const expHighRun = replayManager.generateDeathExplanation(highBarrierRunMeta);
  assert(expHighRun.headline === 'OVERHEAD BARRIER IMPACT', 'Distinguishes failed slide from jump');
  assert(expHighRun.explanation.includes('Failed to slide underneath'), 'Explains failure to slide');

  // 6. Structural Support Pillar
  const pillarMeta: FatalCollisionMetadata = {
    timestamp: 5000,
    reason: 'MAJOR_FATAL_HIT',
    obstacleType: 'PILLAR',
    playerSpeedAtImpact: 20,
    playerStateAtImpact: 'RUN',
    playerLaneAtImpact: 0,
    playerGroundY: 0,
    playerYAtImpact: 0,
    activeProtectionBeforeImpact: { hasShield: false, hasHoverboard: false, isInvulnerable: false }
  };
  const expPillar = replayManager.generateDeathExplanation(pillarMeta);
  assert(expPillar.category === 'PILLAR', 'Structural pillar collision categorized as PILLAR');
  assert(expPillar.explanation.includes('support pillar'), 'Explains pillar collision');

  // 7. Failed Rooftop Landing
  const missedRoofMeta: FatalCollisionMetadata = {
    timestamp: 6000,
    reason: 'MAJOR_FATAL_HIT',
    obstacleType: 'TRAIN',
    isFrontal: true,
    playerSpeedAtImpact: 18,
    playerStateAtImpact: 'JUMP',
    playerLaneAtImpact: 0,
    playerGroundY: 0,
    playerYAtImpact: 2.1, // Undershot rooftop at 4.35m
    activeProtectionBeforeImpact: { hasShield: false, hasHoverboard: false, isInvulnerable: false }
  };
  const expMissedRoof = replayManager.generateDeathExplanation(missedRoofMeta);
  assert(expMissedRoof.category === 'TRAIN_ROOF_MISSED', 'Undershot train jump categorized as TRAIN_ROOF_MISSED');
  assert(expMissedRoof.headline === 'MISSED ROOFTOP LANDING', 'Identifies missed rooftop landing');
  assert(expMissedRoof.explanation.includes('Undershot the height required'), 'Clear explanation of missed roof height');

  // 8. Chaser Officer Thorne Capture
  const captureMeta: FatalCollisionMetadata = {
    timestamp: 7000,
    reason: 'CHASER_CAPTURE',
    playerSpeedAtImpact: 6,
    playerStateAtImpact: 'STUMBLE',
    playerLaneAtImpact: 0,
    playerGroundY: 0,
    playerYAtImpact: 0,
    activeProtectionBeforeImpact: { hasShield: false, hasHoverboard: false, isInvulnerable: false }
  };
  const expCapture = replayManager.generateDeathExplanation(captureMeta);
  assert(expCapture.category === 'CHASER_CAPTURE', 'Officer Thorne catch categorized as CHASER_CAPTURE');
  assert(expCapture.headline.includes('TRANSIT SECURITY'), 'Security capture headline');
  assert(expCapture.explanation.includes('Officer Thorne'), 'Explains momentum loss and capture');

  // 9. Expired Protection Collision
  const expiredMeta: FatalCollisionMetadata = {
    timestamp: 8000,
    reason: 'MAJOR_FATAL_HIT',
    playerSpeedAtImpact: 17,
    playerStateAtImpact: 'RUN',
    playerLaneAtImpact: 0,
    playerGroundY: 0,
    playerYAtImpact: 0,
    activeProtectionBeforeImpact: { hasShield: false, hasHoverboard: false, isInvulnerable: false },
    expiredProtectionRecent: true
  };
  const expExpired = replayManager.generateDeathExplanation(expiredMeta);
  assert(expExpired.category === 'EXPIRED_PROTECTION', 'Expired shield categorized as EXPIRED_PROTECTION');

  // 10. Neutral Fallback Collision
  const fallbackMeta: FatalCollisionMetadata = {
    timestamp: 9000,
    reason: 'UNKNOWN_HIT',
    playerSpeedAtImpact: 15,
    playerStateAtImpact: 'RUN',
    playerLaneAtImpact: 0,
    playerGroundY: 0,
    playerYAtImpact: 0,
    activeProtectionBeforeImpact: { hasShield: false, hasHoverboard: false, isInvulnerable: false }
  };
  const expFallback = replayManager.generateDeathExplanation(fallbackMeta);
  assert(expFallback.category === 'GENERAL_COLLISION', 'Unknown hit categorized as GENERAL_COLLISION neutral fallback');
  assert(expFallback.explanation.includes('Fatal collision with an obstacle'), 'Neutral accurate explanation without inventing fake details');
}

// ============================================================================
// TEST SUITE 3: Protected Collisions Do Not Trigger Fatal Crash Replay
// ============================================================================
console.log('\n--- Test Suite 3: Shield & Hoverboard Protection Safety ---');
{
  const { player, replayManager } = createTestHarness();

  // Activate Shield
  player.powerups.activate('SHIELD', 10);
  assert(player.powerups.hasShieldActive() === true, 'Shield is active on player');

  // Simulate obstacle hit
  const fatalResultShield = player.crash('FATAL_COLLISION');
  // player.crash returns false when protected by shield!
  assert(fatalResultShield === false, 'player.crash returns false when protected by active shield');
  assert(replayManager.getActiveAnalysis() === null, 'Active crash analysis is NOT created for shielded collision');

  // Activate Hoverboard
  player.hoverboardManager.activate();
  assert(player.hoverboardManager.isBoardActive() === true, 'Hoverboard is active on player');

  const fatalResultBoard = player.crash('FATAL_COLLISION');
  assert(fatalResultBoard === false, 'player.crash returns false when protected by hoverboard');
  assert(replayManager.getActiveAnalysis() === null, 'Active crash analysis is NOT created for hoverboard crash absorption');
}

// ============================================================================
// TEST SUITE 4: Replay Playback Timeline, Slow-Mo Curve & State Restoration
// ============================================================================
console.log('\n--- Test Suite 4: Replay Timeline, Slow-Mo Curve & Pose Restoration ---');
{
  const { player, cameraController, replayManager } = createTestHarness();

  // Populate 100 historical frames
  for (let i = 0; i < 100; i++) {
    player.position.set(0, 0, -i * 1.5);
    player.speed = 15;
    cameraController.camera.position.set(0, 3.25, -i * 1.5 + 5.6);
    replayManager.recordFrame(player, cameraController, [], null, i * 0.016);
  }

  // Record fatal crash
  const analysis = replayManager.recordFatalCrash({
    reason: 'MAJOR_FATAL_HIT',
    player,
    isFrontal: true
  });

  assert(analysis !== null, 'recordFatalCrash creates ActiveCrashAnalysis');
  assert(analysis.frames.length > 0, 'Replay analysis contains recorded frames');
  assert(replayManager.getActiveAnalysis() !== null, 'getActiveAnalysis returns frozen fatal metadata');

  // Save pre-replay resting position
  const restingPlayerZ = -150;
  player.position.z = restingPlayerZ;
  player.mesh.position.z = restingPlayerZ;

  // Start replay playback
  const started = replayManager.startPlayback(player, cameraController);
  assert(started === true, 'startPlayback returns true when frames exist');
  assert(replayManager.isPlaybackActive() === true, 'isPlaybackActive returns true');

  // Check initial timeline
  assert(replayManager.getPlaybackProgress() === 0, 'Initial progress is 0.0');
  assert(replayManager.getCurrentTimeScale() === 1.0, 'Normal playback speed (1.0x) at start');

  // Step replay halfway
  replayManager.updatePlayback(0.8, player, cameraController);
  assert(replayManager.getPlaybackProgress() > 0, 'Progress advances with elapsed time');

  // Advance near impact point (around 70% through duration)
  replayManager.updatePlayback(1.2, player, cameraController);
  const slowMoScale = replayManager.getCurrentTimeScale();
  assert(slowMoScale < 0.7 && slowMoScale >= 0.38,
    `Playback smooth slow-motion curve activates approaching impact (${slowMoScale.toFixed(2)}x)`);

  // Stop playback and verify restitution
  replayManager.stopPlayback(player, cameraController);
  assert(replayManager.isPlaybackActive() === false, 'isPlaybackActive is false after stopPlayback');
  assert(player.position.z === restingPlayerZ, 'Player position cleanly restored to pre-replay resting state');
}

// ============================================================================
// TEST SUITE 5: Score & Economy Invariance During Replay
// ============================================================================
console.log('\n--- Test Suite 5: Score, Coins & Progression Invariance ---');
{
  const { player, cameraController, replayManager } = createTestHarness();
  const progression = ProgressionManager.getInstance();

  const initialKeys = progression.getKeys();

  let scoreEventsFired = 0;
  let coinEventsFired = 0;
  const scoreListener = () => { scoreEventsFired++; };
  const coinListener = () => { coinEventsFired++; };

  EventBus.getInstance().on(EVENTS.SCORE_UPDATED, scoreListener);
  EventBus.getInstance().on('COIN_COLLECTED', coinListener);

  // Populate frames and trigger fatal crash
  for (let i = 0; i < 60; i++) {
    replayManager.recordFrame(player, cameraController, [], null, i * 0.016);
  }
  replayManager.recordFatalCrash({ reason: 'MAJOR_FATAL_HIT', player });

  // Start replay
  replayManager.startPlayback(player, cameraController);

  // Simulate multiple replay playback frames
  for (let step = 0; step < 40; step++) {
    replayManager.updatePlayback(0.05, player, cameraController);
  }

  // Verify invariant economics and event isolation
  assert(progression.getKeys() === initialKeys, `Keys balance completely unchanged (${progression.getKeys()} === ${initialKeys})`);
  assert(scoreEventsFired === 0, `No score events emitted during replay playback (${scoreEventsFired} === 0)`);
  assert(coinEventsFired === 0, `No coin collection events emitted during replay playback (${coinEventsFired} === 0)`);

  replayManager.stopPlayback(player, cameraController);

  EventBus.getInstance().off(EVENTS.SCORE_UPDATED, scoreListener);
  EventBus.getInstance().off('COIN_COLLECTED', coinListener);
}

// ============================================================================
// TEST SUITE 6: Revive & Game Flow Clean Reset
// ============================================================================
console.log('\n--- Test Suite 6: Revive & Game Lifecycle Integration ---');
{
  const { player, cameraController, replayManager } = createTestHarness();

  // Populate frames and record fatal crash
  for (let i = 0; i < 40; i++) {
    replayManager.recordFrame(player, cameraController, [], null, i * 0.016);
  }
  const analysis = replayManager.recordFatalCrash({ reason: 'CHASER_CAPTURE', player });
  assert(analysis.explanation.category === 'CHASER_CAPTURE', 'Captured state recorded');

  // Simulate player accepting revive: reset replay state
  replayManager.reset();
  assert(replayManager.getActiveAnalysis() === null, 'Revive clears active fatal analysis');
  assert(replayManager.getBufferCount() === 0, 'Revive clears replay buffer for clean new life');
  assert(replayManager.isPlaybackActive() === false, 'Replay playback is inactive');
}

console.log(`\n================================================================`);
console.log(`🎉 ALL ${passedTests} / ${totalTests} TASK 1 INSTANT REPLAY TESTS PASSED!`);
console.log(`================================================================\n`);
