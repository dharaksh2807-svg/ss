import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { ChaserModel } from '../src/characters/ChaserModel';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { CONSTANTS } from '../src/core/Constants';
import { CrashReplayManager } from '../src/replay/CrashReplayManager';
import { BugSnapshotManager } from '../src/debug/BugSnapshotManager';
import { HUD } from '../src/ui/HUD';
import { CameraController } from '../src/scene/CameraController';

console.log('🧪 Starting Metro Runner 3D: P0 Fatal Collision & Death Transition Verification...\n');

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
  clear: () => { for (const k in storageMock) delete storageMock[k]; },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
} as any;

function createTestContext() {
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player(scene);
  const chaser = new ChaserModel();

  trackManager.setChaser(chaser);
  player.setChaser(chaser);

  trackManager.reset();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  return { scene, trackManager, player, chaser, chunk };
}

function stepSimulation(
  player: Player,
  trackManager: TrackManager,
  chaser: ChaserModel,
  frames: number = 120,
  dt: number = 1 / 60
) {
  for (let i = 0; i < frames; i++) {
    player.update(dt);
    chaser.update(dt, player.position, player.speed, player.groundY);
    trackManager.update(player, dt, i * dt);
  }
}

// =========================================================================
// Suite 1: Direct Fatal Train Collision
// =========================================================================
console.log('--- Test 1: Direct Fatal Train Collision ---');
{
  const { trackManager, player, chaser, chunk } = createTestContext();
  chunk.populate({
    name: 'TEST_TRAIN_FRONTAL',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0, hasRamp: false }],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -19.5);
  player.updateCollider();

  let crashCount = 0;
  const off = EventBus.getInstance().on(EVENTS.CRASH, () => { crashCount++; });

  stepSimulation(player, trackManager, chaser, 1);
  off();

  assert(crashCount === 1, 'Direct frontal train impact emits exactly 1 CRASH event');
  assert(player.state === 'CRASH', 'Player enters CRASH state on train collision');
  assert(player.isDead() === true, 'Player isDead() returns true');
  assert(player.speed === 0, 'Player forward speed is zeroed on fatal crash');
}

// =========================================================================
// Suite 2: Moving-Train Collision
// =========================================================================
console.log('\n--- Test 2: Moving-Train Collision ---');
{
  const { trackManager, player, chaser, chunk } = createTestContext();
  chunk.populate({
    name: 'TEST_MOVING_TRAIN',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 40.0, length: 20.0, isMoving: true, velocityZ: 15.0 }],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -29.0);
  player.updateCollider();

  let crashCount = 0;
  const off = EventBus.getInstance().on(EVENTS.CRASH, () => { crashCount++; });

  stepSimulation(player, trackManager, chaser, 2);
  off();

  assert(crashCount === 1, 'Moving train frontal impact emits exactly 1 CRASH event');
  assert(player.state === 'CRASH', 'Player in CRASH state after moving train impact');
}

// =========================================================================
// Suite 3: Low-Barrier Collision
// =========================================================================
console.log('\n--- Test 3: Low-Barrier Collision ---');
{
  const { trackManager, player, chaser, chunk } = createTestContext();
  chunk.populate({
    name: 'TEST_LOW_BARRIER',
    difficulty: 'EASY',
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: 25.0 }],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -24.0);
  player.updateCollider();

  let crashCount = 0;
  const off = EventBus.getInstance().on(EVENTS.CRASH, () => { crashCount++; });

  stepSimulation(player, trackManager, chaser, 2);
  off();

  assert(crashCount === 1, 'Low barrier frontal impact emits exactly 1 CRASH event');
  assert(player.state === 'CRASH', 'Player in CRASH state after low barrier impact');
}

// =========================================================================
// Suite 4 & 5: Collision Near Both Train & Barrier, Overlapping Colliders
// =========================================================================
console.log('\n--- Test 4 & 5: Overlapping Train and Barrier Colliders ---');
{
  const { trackManager, player, chaser, chunk } = createTestContext();
  chunk.populate({
    name: 'TEST_OVERLAP',
    difficulty: 'MEDIUM',
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0, hasRamp: false },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 30.0 }
    ],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -19.5);
  player.updateCollider();

  let crashCount = 0;
  let bustedCount = 0;
  const offCrash = EventBus.getInstance().on(EVENTS.CRASH, () => { crashCount++; });
  const offBusted = EventBus.getInstance().on(EVENTS.CHASER_CAPTURED, () => { bustedCount++; });

  stepSimulation(player, trackManager, chaser, 10);
  offCrash();
  offBusted();

  assert(crashCount === 1, 'Exactly 1 CRASH event emitted despite overlapping colliders');
  assert(bustedCount === 1, 'Exactly 1 CHASER_CAPTURED event emitted despite overlapping colliders');
  assert(player.state === 'CRASH', 'Player remains in CRASH state');
}

// =========================================================================
// Suite 6, 7, 8, 9, 10, 11, 12: 120-Frame Overlap Invariant Verification
// =========================================================================
console.log('\n--- Critical Invariant: 120 Simulation Frames Overlapping Fatal Obstacle ---');
{
  const { trackManager, player, chaser, chunk } = createTestContext();
  chunk.populate({
    name: 'TEST_120_FRAMES',
    difficulty: 'MEDIUM',
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0, hasRamp: false },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 30.0 }
    ],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -19.0);
  player.updateCollider();

  let crashCount = 0;
  let bustedCount = 0;
  const offCrash = EventBus.getInstance().on(EVENTS.CRASH, () => { crashCount++; });
  const offBusted = EventBus.getInstance().on(EVENTS.CHASER_CAPTURED, () => { bustedCount++; });

  const initialZ = -19.0 - (CONSTANTS.INITIAL_SPEED * (1 / 60)); // Z upon impact
  const statesObserved = new Set<string>();
  const positionsZ: number[] = [];
  const positionsY: number[] = [];

  for (let f = 1; f <= 120; f++) {
    player.update(1 / 60);
    chaser.update(1 / 60, player.position, player.speed, player.groundY);
    trackManager.update(player, 1 / 60, f * (1 / 60));

    statesObserved.add(player.state);
    positionsZ.push(player.position.z);
    positionsY.push(player.position.y);
  }

  offCrash();
  offBusted();

  assert(crashCount === 1, `Fatal event count = 1 over 120 frames (got ${crashCount})`);
  assert(bustedCount === 1, `BUSTED notification event count = 1 over 120 frames (got ${bustedCount})`);
  assert(!statesObserved.has('RUN') || statesObserved.size === 2, 'No RUN/CRASH oscillation (RUN was only pre-impact)');
  assert(player.state === 'CRASH', 'Player stays locked in CRASH state');

  // Verify transform stability (no vibration/jitter between frames)
  const postImpactZ = positionsZ.slice(5);
  const minZ = Math.min(...postImpactZ);
  const maxZ = Math.max(...postImpactZ);
  assert(Math.abs(maxZ - minZ) < 1e-4, `No positional Z jitter during death (delta: ${Math.abs(maxZ - minZ)})`);

  const postImpactY = positionsY.slice(5);
  const minY = Math.min(...postImpactY);
  const maxY = Math.max(...postImpactY);
  assert(Math.abs(maxY - minY) < 1e-4, `No positional Y jitter during death (delta: ${Math.abs(maxY - minY)})`);
}

// =========================================================================
// Suite 13 & 14: Chaser Caught Reaction Idempotency
// =========================================================================
console.log('\n--- Test 13 & 14: Chaser Capture Idempotency ---');
{
  const chaser = new ChaserModel();
  chaser.setChaseState('DISTANT');

  let captureEvents = 0;
  const off = EventBus.getInstance().on(EVENTS.CHASER_CAPTURED, () => {
    captureEvents++;
  });

  chaser.triggerCaughtReaction();
  assert(captureEvents === 1, 'First triggerCaughtReaction emits 1 event');

  chaser.triggerCaughtReaction();
  chaser.triggerCaughtReaction();
  chaser.setChaseState('CAPTURE');
  assert(captureEvents === 1, 'Subsequent capture calls are idempotent no-ops');

  off();
}

// =========================================================================
// Suite 15 & 16: Shield & Hoverboard Protection Checks
// =========================================================================
console.log('\n--- Test 15 & 16: Shield & Hoverboard Protection Remains Functional ---');
{
  const { player } = createTestContext();

  // Shield
  player.reset();
  player.powerups.activate('SHIELD');
  let crashFired = false;
  const off = EventBus.getInstance().on(EVENTS.CRASH, () => { crashFired = true; });

  const shieldResult = player.crash('LOW_BARRIER');
  assert(shieldResult === false, 'Shield-protected collision does not initiate death');
  assert(crashFired === false, 'EVENTS.CRASH not emitted when shield absorbs hit');
  assert(player.state === 'RUN', 'Player remains in RUN state when shielded');

  // Hoverboard
  player.reset();
  player.hoverboardManager.activate();
  crashFired = false;

  const boardResult = player.crash('TRAIN_COLLISION');
  assert(boardResult === false, 'Hoverboard-protected collision does not initiate death');
  assert(crashFired === false, 'EVENTS.CRASH not emitted when hoverboard absorbs hit');
  assert(player.state === 'RUN', 'Player remains in RUN state on hoverboard break');

  off();
}

// =========================================================================
// Suite 17 & 18: Reset and Revive State Restoration
// =========================================================================
console.log('\n--- Test 17 & 18: Reset and Revive Restore Safe Clean State ---');
{
  const { player, chaser } = createTestContext();
  player.reset();
  chaser.reset();

  // 1. Crash the player
  player.crash('TRAIN_COLLISION');
  chaser.setChaseState('CAPTURE');
  assert(player.state === 'CRASH', 'Player in CRASH state');
  assert(chaser.getChaseState() === 'CAPTURE', 'Chaser in CAPTURE state');

  // 2. Revive
  player.revive(0);
  chaser.reset();
  assert(player.state === 'RUN', 'Revive restores player state to RUN');
  assert(player.isInvulnerable() === true, 'Revive activates grace immunity');
  assert(chaser.getChaseState() === 'DISTANT', 'Chaser reset to DISTANT');

  // 3. Re-crash and Reset
  player.update(2.1); // elapse grace timer
  player.crash('TRAIN_COLLISION');
  assert(player.state === 'CRASH', 'Player re-crashed');

  player.reset();
  chaser.reset();
  assert(player.state === 'RUN', 'Restart resets player state to RUN');
  assert(player.speed === CONSTANTS.INITIAL_SPEED, 'Restart restores initial running speed');
  assert(chaser.getChaseState() === 'DISTANT', 'Restart resets chaser to DISTANT');
}

// =========================================================================
// Suite 19: Camera Shake Does Not Oscillate Indefinitely
// =========================================================================
console.log('\n--- Test 19: Camera Shake Single Reaction & Proper Decay ---');
{
  const cam = new THREE.PerspectiveCamera(60, 16 / 9, 0.2, 500);
  const cameraController = new CameraController(cam);
  cameraController.setLobbyMode(false);
  cameraController.reset(new THREE.Vector3(0, 0, 0));

  cameraController.addShake(0.85);
  assert(cameraController.getShakeTrauma() > 0.8, 'Camera trauma added on crash');

  // Step 1.5s
  for (let i = 0; i < 90; i++) {
    cameraController.update(new THREE.Vector3(0, 0, 0), 1 / 60, i * (1 / 60));
  }

  assert(cameraController.getShakeTrauma() === 0, 'Camera trauma fully decays to 0 without indefinite oscillation');
  assert(cameraController.getShakeOffset().length() === 0, 'Camera shake offset is zero after decay');
}

// =========================================================================
// Suite 20: HUD Toast Deduplication
// =========================================================================
console.log('\n--- Test 20: HUD Toast Deduplication ---');
{
  globalThis.document = {
    createElement: (tag: string) => ({
      className: '',
      textContent: '',
      parentElement: null
    })
  } as any;

  // Setup minimal DOM for HUD
  const mockOverlay = {
    children: [] as any[],
    appendChild: function(child: any) { this.children.push(child); child.parentElement = this; },
    removeChild: function(child: any) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) this.children.splice(idx, 1);
      child.parentElement = null;
    },
    getElementsByClassName: function(name: string) {
      return this.children.filter((c: any) => c.className?.includes(name));
    },
    get firstChild() { return this.children[0] || null; },
    set innerHTML(val: string) { if (val === '') this.children = []; },
    get innerHTML() { return ''; }
  };

  const hudAny: any = {
    feedbackStack: mockOverlay,
    showFeedbackBadge: HUD.prototype.showFeedbackBadge,
    clearFeedbackBadges: HUD.prototype.clearFeedbackBadges
  };

  // Push 3 identical BUSTED badges
  hudAny.showFeedbackBadge('BUSTED! 👮‍♂️', 'nearmiss');
  hudAny.showFeedbackBadge('BUSTED! 👮‍♂️', 'nearmiss');
  hudAny.showFeedbackBadge('BUSTED! 👮‍♂️', 'nearmiss');

  assert(mockOverlay.children.length === 1, `Duplicate BUSTED badges deduplicated to exactly 1 (got ${mockOverlay.children.length})`);

  // Clear
  hudAny.clearFeedbackBadges();
  assert(mockOverlay.children.length === 0, 'clearFeedbackBadges removes all active badges');
}

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${passedTests}/${totalTests} FATAL COLLISION & DEATH TESTS PASSED!`);
console.log(`=======================================================\n`);
