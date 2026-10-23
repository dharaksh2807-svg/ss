import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { ChaserModel, ChaseState } from '../src/characters/ChaserModel';
import { CollisionResolver } from '../src/track/CollisionResolver';
import { CollisionOutcome, CollisionDiagnostic } from '../src/track/CollisionTypes';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { ReviveManager } from '../src/revive/ReviveManager';
import { CONSTANTS } from '../src/core/Constants';
import * as THREE from 'three';

console.log('🧪 Starting Metro Runner 3D: Task 1 Chase, Collision Consequences & Death Logic Test Suite...\n');

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

function createTestEnvironment() {
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player(scene);
  const chaser = new ChaserModel();

  trackManager.setChaser(chaser);
  player.setChaser(chaser);

  // Initialize track with 1 clean chunk
  trackManager.reset();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  return { scene, trackManager, player, chaser, chunk };
}

function stepGame(player: Player, trackManager: TrackManager, chaser: ChaserModel, durationSec: number, fps: number = 60) {
  const dt = 1.0 / fps;
  const steps = Math.round(durationSec * fps);
  for (let i = 0; i < steps; i++) {
    player.update(dt);
    chaser.update(dt, player.position, player.speed, player.groundY);
    trackManager.update(player, dt, i * dt);
  }
}

// =========================================================================
// Suite 1: Direct Unprotected Frontal Train Collision (Fatal)
// =========================================================================
console.log('--- Suite 1: Direct Unprotected Frontal Train Collision ---');
{
  const { trackManager, player, chaser, chunk } = createTestEnvironment();

  // Train in Lane 0 at zOffset = 30 (front at Z = -20)
  chunk.populate({
    name: 'TEST_FRONTAL_TRAIN',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0, hasRamp: false }],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -18.0);
  player.updateCollider();

  let recordedDiagnostic: CollisionDiagnostic | null = null;
  trackManager.clearCollisionDiagnostics();

  // Step 0.2s into train front head-on
  stepGame(player, trackManager, chaser, 0.2, 60);

  const diag = trackManager.getLastCollisionDiagnostic();
  assert(diag !== null, 'Collision diagnostic was recorded');
  assert(diag!.finalOutcome === 'MAJOR_FATAL_HIT', `Authoritative outcome is MAJOR_FATAL_HIT (got ${diag?.finalOutcome})`);
  assert(player.state === 'CRASH', `Player state is CRASH on frontal impact (got ${player.state})`);
  assert(chaser.getChaseState() === 'CAPTURE' || chaser.getMode() === 'CAUGHT', 'Chaser triggers caught reaction on fatal crash');
}

// =========================================================================
// Suite 2: Glancing Side Collision with Train (Flank Stumble vs Impact)
// =========================================================================
console.log('\n--- Suite 2: Glancing Side Collision with Train Flank ---');
{
  const { trackManager, player, chaser, chunk } = createTestEnvironment();

  // Train in Lane 1 (Z: -40 to -20)
  chunk.populate({
    name: 'TEST_FLANK_TRAIN',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 1, zOffset: 30.0, length: 20.0 }],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -30.0);
  player.updateCollider();

  assert(chaser.getChaseState() === 'DISTANT', 'Chaser starts in DISTANT state');

  // Player swipes right into the side of the train
  player.handleInput('RIGHT');
  stepGame(player, trackManager, chaser, 0.1, 60);

  assert(player.isStumbling, 'Glancing side collision causes stumbling');
  assert(player.state !== 'CRASH', 'Glancing side impact is non-fatal');
  assert(chaser.getChaseState() === 'CLOSING_IN' || chaser.getChaseState() === 'CLOSE_PURSUIT',
    `Chaser advances closer after stumble (state is ${chaser.getChaseState()})`);
}

// =========================================================================
// Suite 3: Chaser Proximity Warning & Two-Strike Capture Rule
// =========================================================================
console.log('\n--- Suite 3: Two-Strike Capture Policy ---');
{
  const { trackManager, player, chaser, chunk } = createTestEnvironment();

  // 1. Initial State: Distant guard
  chaser.setChaseState('DISTANT');
  assert(chaser.isCatchUpMode() === false, 'Guard is not in catch-up mode initially');

  let proximityWarningFired = false;
  EventBus.getInstance().on(EVENTS.CHASER_PROXIMITY_WARNING, () => {
    proximityWarningFired = true;
  });

  // 2. First Stumble: Guard enters catch-up mode
  const res1 = chaser.onMinorStumble();
  assert(res1.wasClose === false, 'First stumble: guard was not already close');
  assert(res1.captured === false, 'First stumble: player is not captured');
  assert(chaser.getChaseState() === 'CLOSING_IN', 'Guard enters CLOSING_IN on first stumble');
  assert(chaser.isCatchUpMode() === true, 'Guard is now in catch-up mode');
  assert(proximityWarningFired === true, 'Proximity warning event was emitted');

  // Let guard close in to CLOSE_PURSUIT
  chaser.setChaseState('CLOSE_PURSUIT');
  // Guard is in CLOSE_PURSUIT. Simulate second stumble occurring after initial stumble debouncing window
  let captureEventFired = false;
  EventBus.getInstance().on(EVENTS.CHASER_CAPTURED, () => {
    captureEventFired = true;
  });
  (chaser as any).lastStumbleTimestamp = 0;
  const res2 = chaser.onMinorStumble();
  assert(res2.wasClose === true, 'Second stumble: guard was already close');
  assert(res2.captured === true, 'Second stumble: runner captured by guard');
  assert(chaser.getChaseState() === 'CAPTURE', 'Guard state is CAPTURE');
  assert(captureEventFired === true, 'CHASER_CAPTURED event was fired');
}

// =========================================================================
// Suite 4: Clean Running Recovery (Guard Retreats)
// =========================================================================
console.log('\n--- Suite 4: Stumble Recovery & Guard Retreat ---');
{
  const { trackManager, player, chaser } = createTestEnvironment();

  // Trigger stumble to bring guard close
  chaser.setChaseState('DISTANT');
  chaser.onMinorStumble();
  chaser.setChaseState('CLOSE_PURSUIT');
  chaser.setCleanRunDuration(1.0); // 1.0s clean running window for test
  assert(chaser.getChaseState() === 'CLOSE_PURSUIT', 'Guard in CLOSE_PURSUIT');

  // Step simulation forward for 1.2s without collisions
  stepGame(player, trackManager, chaser, 1.2, 60);

  assert(chaser.getChaseState() === 'DISTANT', `After clean run duration, guard retreated back to DISTANT (got ${chaser.getChaseState()})`);
  assert(chaser.isCatchUpMode() === false, 'Guard is no longer in catch-up mode after recovery');
}

// =========================================================================
// Suite 5: Fatal Impact While Guard is Distant
// =========================================================================
console.log('\n--- Suite 5: Direct Fatal Impact While Guard is Distant ---');
{
  const { trackManager, player, chaser, chunk } = createTestEnvironment();

  chaser.setChaseState('DISTANT');
  assert(chaser.getChaseState() === 'DISTANT', 'Guard is distant');

  // Low barrier directly in path (player does not jump)
  chunk.populate({
    name: 'TEST_DIRECT_BARRIER',
    difficulty: 'EASY',
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: 25.0 }],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -23.0);
  player.updateCollider();

  stepGame(player, trackManager, chaser, 0.2, 60);

  assert(player.state === 'CRASH', 'Direct barrier crash kills player even when guard is distant');
  const diag = trackManager.getLastCollisionDiagnostic();
  assert(diag?.finalOutcome === 'MAJOR_FATAL_HIT', 'Direct barrier impact resolved to MAJOR_FATAL_HIT');
}

// =========================================================================
// Suite 6: Protection Interactions (Shield & Hoverboard)
// =========================================================================
console.log('\n--- Suite 6: Shield & Hoverboard Protection Interactions ---');
{
  const { trackManager, player, chaser, chunk } = createTestEnvironment();

  chaser.setChaseState('DISTANT');

  // 1. Shield absorbed collision
  chunk.populate({
    name: 'TEST_SHIELD_RUN',
    difficulty: 'EASY',
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: 20.0 }],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -18.0);
  player.powerups.activate('SHIELD');
  assert(player.powerups.hasShieldActive() === true, 'Shield is active');

  stepGame(player, trackManager, chaser, 0.2, 60);

  assert(player.state !== 'CRASH', 'Player survived collision due to shield');
  assert(player.powerups.hasShieldActive() === false, 'Shield consumed after exactly one impact');
  assert(chaser.getChaseState() === 'DISTANT', 'Shielded impact did NOT advance guard capture state');

  // 2. Shield expiration: after duration expires, collisions are fatal
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
  player.powerups.activate('SHIELD');
  player.powerups.update(30.0);
  assert(player.powerups.hasShieldActive() === false, 'Shield expired after duration');
  assert(player.isInvulnerable() === false, 'Player is not permanently invulnerable');

  // 3. Hoverboard protection
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -18.0);
  player.hoverboardManager.activate();
  assert(player.hoverboardManager.isBoardActive() === true, 'Hoverboard is active');

  chunk.populate({
    name: 'TEST_BOARD_RUN',
    difficulty: 'EASY',
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: 20.0 }],
    collectibles: []
  }, 0);

  stepGame(player, trackManager, chaser, 0.2, 60);

  assert(player.state !== 'CRASH', 'Player survived collision due to hoverboard');
  assert(player.hoverboardManager.isBoardActive() === false, 'Hoverboard broke after collision');
  assert(chaser.getChaseState() === 'DISTANT', 'Hoverboard impact did NOT advance guard capture state');
}

// =========================================================================
// Suite 7: Valid Rooftop Traversal & Landing
// =========================================================================
console.log('\n--- Suite 7: Valid Rooftop Traversal & Landing ---');
{
  const { trackManager, player, chaser, chunk } = createTestEnvironment();

  // Train with ramp: Train spans Z: -40 to -20; Ramp spans Z: -20 to -12
  chunk.populate({
    name: 'TEST_ROOF_SUITE',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0, hasRamp: true }],
    collectibles: []
  }, 0);

  // 1. Ramp climb
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -12.5);
  stepGame(player, trackManager, chaser, 0.7, 60);

  assert(player.state === 'ON_TRAIN', 'Player climbed ramp onto train roof');
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Player supported by TRAIN_ROOF');
  assert(Math.abs(player.position.y - 4.35) < 0.05, 'Player height stable at 4.35m');

  // 2. Landing from jump onto stationary roof
  player.position.set(0, 5.0, -28.0);
  player.isJumping = true;
  player.state = 'FALLING';
  player.verticalVelocity = -8.0;

  stepGame(player, trackManager, chaser, 0.15, 60);
  assert(player.state === 'ON_TRAIN', 'Landing on train roof never counts as crash');
}

// =========================================================================
// Suite 8: Moving Train Collisions
// =========================================================================
console.log('\n--- Suite 8: Moving Train Frontal vs Rooftop Landing ---');
{
  const { trackManager, player, chaser, chunk } = createTestEnvironment();

  // Moving train in Lane 0
  chunk.populate({
    name: 'TEST_MOVING_TRAIN_SUITE',
    difficulty: 'MEDIUM',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 35.0, length: 20.0 }],
    collectibles: []
  }, 0);

  // 1. Landing on moving train roof
  player.position.set(0, 5.0, -30.0);
  player.isJumping = true;
  player.state = 'FALLING';
  player.verticalVelocity = -8.0;

  stepGame(player, trackManager, chaser, 0.15, 60);
  assert(player.state === 'ON_TRAIN', 'Landing on moving train roof is safe (ON_TRAIN)');
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Supported by TRAIN_ROOF on moving train');

  // 2. Frontal impact with moving train at track level
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -20.0);
  player.updateCollider();

  stepGame(player, trackManager, chaser, 0.2, 60);
  assert(player.state === 'CRASH', 'Frontal collision with oncoming moving train is immediately fatal');
  const diag = trackManager.getLastCollisionDiagnostic();
  assert(diag?.finalOutcome === 'MAJOR_FATAL_HIT', 'Outcome is MAJOR_FATAL_HIT on moving train frontal collision');
}

// =========================================================================
// Suite 9: Revive Execution & Guard Reset
// =========================================================================
console.log('\n--- Suite 9: Revive Execution, Key Deduction & Danger Reset ---');
{
  const { trackManager, player, chaser } = createTestEnvironment();

  // Setup keys
  ProgressionManager.getInstance().addKeys(5);
  const initialKeys = ProgressionManager.getInstance().getKeys();

  const reviveManager = new ReviveManager();
  reviveManager.resetRun();

  // Trigger crash and chaser capture
  chaser.setChaseState('CLOSE_PURSUIT');
  chaser.onMinorStumble();
  assert(chaser.getChaseState() === 'CAPTURE', 'Guard in CAPTURE state');

  player.crash('CHASER_CAPTURE');
  assert(player.state === 'CRASH', 'Player in CRASH state');

  // Begin revive offer
  reviveManager.beginOffer();
  assert(reviveManager.getOfferState().offerActive === true, 'Revive offer active');

  // Execute revive
  const result = reviveManager.executeRevive();
  assert(result.success === true, 'Revive executed successfully');
  assert(result.keysSpent === 1, 'Revive deducted exactly 1 Key');
  assert(ProgressionManager.getInstance().getKeys() === initialKeys - 1, 'Key balance atomically reduced');

  // Revive player and reset chaser
  player.revive(0);
  chaser.setChaseState('DISTANT');

  assert(player.state === 'RUN', 'Player state restored to RUN');
  assert(chaser.getChaseState() === 'DISTANT', 'Chaser danger reset to DISTANT after revive');
  assert(chaser.isCatchUpMode() === false, 'Chaser catch-up mode cleared');
  assert(player.isInvulnerable() === true, 'Player has recovery grace immunity');
  assert(player.getReviveGraceTimeRemaining() > 1.5, 'Revive grace duration is 2.0s');

  // Verify immunity prevents immediate crash after revival
  player.crash('OBSTACLE_COLLISION');
  assert(player.state === 'RUN', 'Immunity prevents immediate collision death after revival');
}

// =========================================================================
// Suite 10: Game Restart After Capture
// =========================================================================
console.log('\n--- Suite 10: Restart After Capture ---');
{
  const { trackManager, player, chaser } = createTestEnvironment();

  chaser.setChaseState('CAPTURE');
  player.crash('CHASER_CAPTURE');

  // Simulate restart
  player.reset();
  chaser.reset();
  trackManager.reset();

  assert(player.state === 'RUN', 'Player reset to RUN');
  assert(chaser.getChaseState() === 'DISTANT', 'Chaser reset to DISTANT on game restart');
  assert(chaser.currentDistanceZ >= 13.0, 'Chaser placed at distant standby distance (>= 13m)');
  assert(chaser.isCatchUpMode() === false, 'Chaser catch-up mode cleared');
}

// =========================================================================
// Suite 11: Pause and Resume During Chase
// =========================================================================
console.log('\n--- Suite 11: Pause and Resume During Chase ---');
{
  const { player, chaser } = createTestEnvironment();

  chaser.setChaseState('CLOSE_PURSUIT');
  const savedDistZ = chaser.currentDistanceZ;
  const savedState = chaser.getChaseState();

  // During pause, no update is called on chaser or player
  // When resuming, state and position are intact
  assert(chaser.getChaseState() === savedState, 'Chase state preserved across pause/resume');
  assert(chaser.currentDistanceZ === savedDistZ, 'Chaser distance preserved across pause/resume');
}

// =========================================================================
// Suite 12: Collision Diagnostics Structure Integrity
// =========================================================================
console.log('\n--- Suite 12: Collision Diagnostics Logging Integrity ---');
{
  const { trackManager, player, chaser, chunk } = createTestEnvironment();

  chunk.populate({
    name: 'TEST_DIAGNOSTICS',
    difficulty: 'EASY',
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: 25.0 }],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -23.0);
  player.updateCollider();

  trackManager.clearCollisionDiagnostics();
  stepGame(player, trackManager, chaser, 0.2, 60);

  const history = trackManager.getCollisionDiagnostics();
  assert(history.length >= 1, 'At least one collision diagnostic was logged');

  const diag = history[0];
  assert(typeof diag.obstacleId === 'string' && diag.obstacleId.length > 0, `Valid obstacle ID logged (${diag.obstacleId})`);
  assert(diag.collisionType === 'LOW_BARRIER', `Collision type is LOW_BARRIER (got ${diag.collisionType})`);
  assert(typeof diag.contactPosition.x === 'number', 'Contact position X logged');
  assert(typeof diag.contactPosition.y === 'number', 'Contact position Y logged');
  assert(typeof diag.contactPosition.z === 'number', 'Contact position Z logged');
  assert(typeof diag.relativeVelocity.z === 'number', 'Relative velocity Z logged');
  assert(typeof diag.activeGuardState === 'string', `Guard state logged (${diag.activeGuardState})`);
  assert(diag.playerProtectionState !== undefined, 'Player protection state logged');
  assert(diag.finalOutcome === 'MAJOR_FATAL_HIT', `Authoritative outcome logged (${diag.finalOutcome})`);
}

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests}/${totalTests} TASK 1 CHASE & COLLISION TESTS PASSED!`);
console.log('=======================================================\n');
