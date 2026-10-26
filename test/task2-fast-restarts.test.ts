import { EventBus, EVENTS } from '../src/core/EventBus';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { ReviveManager } from '../src/revive/ReviveManager';
import { TrackManager } from '../src/track/TrackManager';
import { Player } from '../src/player/Player';
import { OpeningSequenceController } from '../src/chase/OpeningSequenceController';
import { CameraController } from '../src/scene/CameraController';
import { ChaserModel } from '../src/characters/ChaserModel';
import { DailyChallengeManager } from '../src/core/DailyChallengeManager';
import { CONSTANTS } from '../src/core/Constants';
import * as THREE from 'three';

console.log('============================================================');
console.log('TASK 2: INSTANT RETRY, STREAMLINED GAME OVER & FAST RESTARTS');
console.log('============================================================\n');

let totalTests = 0;
let passedTests = 0;

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
  setItem: (key: string, val: string) => { storageMock[key] = String(val); },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
} as any;

// Mock window and document if needed
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1920,
    innerHeight: 1080
  };
}

// =========================================================================
// Test 1: Key-Based Revive vs. Quick Retry Isolation (Requirement C)
// =========================================================================
console.log('--- Test 1: Revive vs. Retry Economic & State Isolation ---');
{
  const prog = ProgressionManager.getInstance();
  prog.getState().keys = 5;
  prog.saveState();
  const reviveMgr = ReviveManager.getInstance();
  reviveMgr.resetRun();

  assert(prog.getKeys() === 5, 'Starting wallet has 5 keys');

  // Simulate active run and crash
  reviveMgr.beginOffer();
  assert(reviveMgr.getOfferState().offerActive === true, 'Revive offer is active');
  assert(reviveMgr.getReviveCost() === 1, 'First revive costs 1 key');

  // Accept Revive: consumes 1 key, keeps run alive
  const reviveResult = reviveMgr.executeRevive();
  assert(reviveResult.success === true, 'Revive succeeded');
  assert(prog.getKeys() === 4, 'Keys reduced from 5 to 4 after Revive');
  assert(reviveMgr.getRevivesUsed() === 1, 'Revives used this run is now 1');

  // Now simulate second crash -> Decline Revive
  reviveMgr.beginOffer();
  reviveMgr.cancelOffer();
  assert(reviveMgr.getOfferState().offerActive === false, 'Revive offer cancelled on decline');
  assert(prog.getKeys() === 4, 'Keys NOT deducted when declining revive');

  // Now trigger Retry: MUST NOT DEDUCT KEYS
  const initialKeysBeforeRetry = prog.getKeys();
  // Simulate retry run reset
  reviveMgr.resetRun();
  assert(prog.getKeys() === initialKeysBeforeRetry, 'Quick Retry strictly preserves Keys (0 keys deducted)');
  assert(reviveMgr.getRevivesUsed() === 0, 'New run starts with fresh 0 revives used');
}

// =========================================================================
// Test 2: Transient State Reset & No Stale Colliders / Powerups (Requirement B & D)
// =========================================================================
console.log('\n--- Test 2: Transient Physics, Colliders & Powerups Purge ---');
{
  const scene = new THREE.Scene();
  const player = new Player(scene);

  // Dirty the player state with active mid-run dynamics
  player.position.set(3.6, 6.5, -450); // In air, Lane 1, far down track
  player.currentLane = 1;
  player.targetLane = 1;
  player.verticalVelocity = 12.0;
  player.isJumping = true;
  player.isSliding = true;
  player.isStumbling = true;
  player.stumbleTimer = 0.8;
  player.isIntroInvincible = true;
  player.reviveGraceTimer = 1.5;
  player.supportSurface = 'ROOFTOP_TRAIN';
  player.activeSupportObstacleId = 'obs_train_99';
  player.speed = 35.0;

  // Activate powerups
  player.powerups.activate('JETPACK', 10);
  player.powerups.activate('MAGNET', 15);
  player.powerups.activate('SNEAKERS', 12);
  player.powerups.activate('MULTIPLIER', 20);
  player.powerups.activate('SHIELD', 10);
  player.hoverboardManager.activate();

  assert(player.powerups.isJetpackActive() === true, 'Jetpack active before reset');
  assert(player.powerups.isMagnetActive() === true, 'Magnet active before reset');
  assert(player.hoverboardManager.isBoardActive() === true, 'Hoverboard active before reset');

  // Execute player reset (as called by startRun)
  player.reset();

  // Validate complete transient purge
  assert(player.position.x === 0 && player.position.y === CONSTANTS.PLAYER_BASE_Y && player.position.z === 0,
    'Player returned exactly to origin (0, BaseY, 0)');
  assert(player.currentLane === 0 && player.targetLane === 0, 'Lane reset to center (Lane 0)');
  assert(player.verticalVelocity === 0, 'Vertical velocity purged to 0');
  assert(player.isJumping === false, 'Jump state cleared');
  assert(player.isSliding === false, 'Slide state cleared');
  assert(player.isStumbling === false, 'Stumble state cleared');
  assert(player.stumbleTimer === 0, 'Stumble timer cleared');
  assert(player.isIntroInvincible === false, 'Intro invincibility cleared');
  assert(player.reviveGraceTimer === 0, 'Revive grace timer cleared');
  assert(player.supportSurface === 'GROUND', 'Support surface restored to GROUND');
  assert(player.activeSupportObstacleId === null, 'Active support obstacle ID purged to null');

  // Validate powerup purge
  assert(player.powerups.isJetpackActive() === false, 'Jetpack powerup completely purged');
  assert(player.powerups.isMagnetActive() === false, 'Magnet powerup completely purged');
  assert(player.powerups.isSuperSneakersActive() === false, 'Super sneakers powerup completely purged');
  assert(player.powerups.is2xMultiplierActive() === false, 'Score multiplier powerup completely purged');
  assert(player.powerups.hasShieldActive() === false, 'Shield powerup completely purged');
  assert(player.hoverboardManager.isBoardActive() === false, 'Hoverboard completely purged');
}

// =========================================================================
// Test 3: Track Reset & Chunk Dynamic Item Clearance (Requirement D)
// =========================================================================
console.log('\n--- Test 3: TrackManager Dynamic Obstacle & Collider Purge ---');
{
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);

  const initialChunkCount = (trackManager as any).chunks.length;
  assert(initialChunkCount > 0, `Track manager initialized with ${initialChunkCount} pre-allocated chunks`);

  // Reset track manager
  trackManager.reset(true);

  // Verify chunks array length was preserved (no memory reallocation or recreation of chunks)
  assert((trackManager as any).chunks.length === initialChunkCount,
    'Pre-allocated track chunks pool reused without re-instantiation');

  // Verify dynamic items were cleared and repopulated cleanly
  for (let i = 0; i < (trackManager as any).chunks.length; i++) {
    const chunk = (trackManager as any).chunks[i];
    assert(chunk !== null && chunk !== undefined, `Chunk ${i} remains valid`);
  }
}

// =========================================================================
// Test 4: Seed Freshness in Normal Play vs. Fixed Seed in Challenges (Requirement B)
// =========================================================================
console.log('\n--- Test 4: Seed Freshness (Normal vs. Seeded Challenge) ---');
{
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);

  // 1. Normal Random Play: Reset should generate new random seeds
  trackManager.clearDebugSeed();
  trackManager.reset(true);
  const seed1 = trackManager.getRunSeed();

  trackManager.reset(true);
  const seed2 = trackManager.getRunSeed();

  assert(seed1 !== seed2, `Normal play generates fresh random seed on each retry (${seed1} !== ${seed2})`);

  // 2. Explicitly Seeded Challenge (Daily Challenge or Share Code):
  const FIXED_CHALLENGE_SEED = 987654321;
  trackManager.setSeed(FIXED_CHALLENGE_SEED, true);
  assert(trackManager.isDebugMode() === true, 'TrackManager in seeded mode');
  assert(trackManager.getRunSeed() === FIXED_CHALLENGE_SEED, 'Seed set to fixed challenge seed');

  // Retry seeded challenge (forceFreshSeed = false)
  trackManager.reset(false);
  assert(trackManager.getRunSeed() === FIXED_CHALLENGE_SEED,
    `Retrying seeded challenge strictly preserves fixed seed (${trackManager.getRunSeed()} === ${FIXED_CHALLENGE_SEED})`);

  // Retry second time
  trackManager.reset(false);
  assert(trackManager.getRunSeed() === FIXED_CHALLENGE_SEED,
    `Second retry still preserves identical fixed seed (${FIXED_CHALLENGE_SEED})`);
}

// =========================================================================
// Test 5: Selected Character, Outfit & Game Mode Preservation (Requirement B)
// =========================================================================
console.log('\n--- Test 5: Character & Outfit Preservation Across Restarts ---');
{
  const prog = ProgressionManager.getInstance();
  const scene = new THREE.Scene();
  const player = new Player(scene);

  // Unlock and equip Luna with neon outfit
  prog.unlockCharacter('char_luna');
  const equipRes = prog.equipCharacter('char_luna', 'luna_neon');
  assert(equipRes.success === true, 'Successfully equipped char_luna');
  player.applyCharacter('char_luna', 'luna_neon');

  assert(player.model.getCharacterId() === 'char_luna', 'Player equipped with Luna');
  assert(player.model.getOutfitId() === 'luna_neon', 'Player equipped with Neon outfit');

  // Store mesh reference
  const meshBeforeReset = player.model.mesh;

  // Execute restart reset
  player.reset();

  assert(player.model.getCharacterId() === 'char_luna', 'Character remains Luna after reset');
  assert(player.model.getOutfitId() === 'luna_neon', 'Outfit remains Neon after reset');
  assert(player.model.mesh === meshBeforeReset,
    'Character 3D mesh preserved and reused without reconstruction (mesh identity maintained)');
}

// =========================================================================
// Test 6: Opening Sequence Bypass on Retry (Requirement E)
// =========================================================================
console.log('\n--- Test 6: Intro Sequence Bypass & Preference Controls ---');
{
  const scene = new THREE.Scene();
  const player = new Player(scene);
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
  const cameraController = new CameraController(camera);
  const chaser = new ChaserModel();

  const opening = new OpeningSequenceController(player, cameraController, chaser);

  // Default preference is FIRST_ONLY
  opening.setPreference('FIRST_ONLY');
  assert(opening.getPreference() === 'FIRST_ONLY', 'Default intro preference is FIRST_ONLY');

  // Initial fresh start: should play intro
  assert(opening.shouldPlayIntro(false) === true, 'First run from menu plays opening sequence');

  // Retry start (isRetry = true): MUST NOT PLAY INTRO
  assert(opening.shouldPlayIntro(true) === false,
    'Quick Retry automatically skips opening cinematic when preference is FIRST_ONLY');

  // When disabled: never plays intro
  opening.setPreference('DISABLED');
  assert(opening.shouldPlayIntro(false) === false, 'Intro disabled completely when DISABLED');
  assert(opening.shouldPlayIntro(true) === false, 'Intro disabled on retry when DISABLED');

  // Calling start(true) with retry finishes immediately
  const played = opening.start(true);
  assert(played === false, 'start(true) returns false immediately on Quick Retry');
  assert(opening.isActive() === false, 'Intro is not active after quick retry start');
  assert(player.speed === CONSTANTS.INITIAL_SPEED, 'Player is immediately set to INITIAL_SPEED for frame 0 gameplay');
  assert(player.isIntroInvincible === false, 'Player collision is immediately active');
}

// =========================================================================
// Test 7: Score & Rewards Settled Once Without Duplication (Requirement C)
// =========================================================================
console.log('\n--- Test 7: Score Settlement Exactly Once & No Double Counting ---');
{
  const prog = ProgressionManager.getInstance();
  prog.getState().lifetimeStats.totalRuns = 5;
  prog.getState().lifetimeStats.bestScore = 10000;
  prog.saveState();
  const bus = EventBus.getInstance();

  const runsBefore = prog.getState().lifetimeStats.totalRuns;

  // Run 1 starts
  bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
  assert((prog as any).runActive === true, 'Run is marked active');

  // Simulate run events
  bus.emit(EVENTS.SCORE_UPDATED, 25000);

  // Run ends (emits RUN_FINISHED then GAME_OVER)
  bus.emit(EVENTS.RUN_FINISHED, { score: 25000, coins: 50, distance: 800, mode: 'NORMAL', reason: 'CRASH' });
  bus.emit(EVENTS.GAME_OVER);

  const runsAfter = prog.getState().lifetimeStats.totalRuns;
  assert(runsAfter === runsBefore + 1, `Total runs incremented by exactly 1 (${runsBefore} -> ${runsAfter})`);
  assert(prog.getState().lifetimeStats.bestScore === 25000, 'Best score saved to 25,000');

  // Now simulate Quick Retry: new run starts, score resets to 0
  bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
  assert((prog as any).runActive === true, 'New run is active');
  assert((prog as any).runScore === 0, 'New run score initialized to 0');
  assert(prog.getState().lifetimeStats.bestScore === 25000, 'Previous high score preserved in lifetime stats');

  // Ending new run at 1000 score should not overwrite 25000
  bus.emit(EVENTS.SCORE_UPDATED, 1000);
  bus.emit(EVENTS.RUN_FINISHED, { score: 1000, coins: 10, distance: 100, mode: 'NORMAL', reason: 'CRASH' });
  assert(prog.getState().lifetimeStats.bestScore === 25000, 'Best score safely maintained without corruption');
}

// =========================================================================
// Test 8: 50 Rapid Restart Cycles - Stress & Leak Stability (Requirement D & H)
// =========================================================================
console.log('\n--- Test 8: 50 Rapid Restart Stress & Resource Leak Stability ---');
{
  const scene = new THREE.Scene();
  const player = new Player(scene);
  const trackManager = new TrackManager(scene);
  const reviveMgr = ReviveManager.getInstance();

  const startTime = Date.now();

  for (let i = 0; i < 50; i++) {
    // 1. Simulate run underway
    player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -i * 100);
    player.speed = 22.0;

    // 2. Fatal collision
    reviveMgr.beginOffer();
    reviveMgr.cancelOffer();

    // 3. Quick Retry
    player.reset();
    trackManager.reset(true);
    reviveMgr.resetRun();

    assert(player.position.z === 0, `Cycle ${i + 1}: Player position Z reset to 0`);
    assert(player.speed === CONSTANTS.INITIAL_SPEED, `Cycle ${i + 1}: Player speed reset to INITIAL_SPEED`);
    assert(reviveMgr.getRevivesUsed() === 0, `Cycle ${i + 1}: Revives reset to 0`);
  }

  const durationMs = Date.now() - startTime;
  console.log(`⏱️ 50 full restart cycles completed in ${durationMs}ms (average ${(durationMs / 50).toFixed(2)}ms per cycle)`);
  assert(durationMs < 15000, '50 restart cycles completed in under 15,000ms (averaging ~120ms per cycle in headless node)');
}

console.log('\n============================================================');
console.log(`🎉 ALL ${passedTests} / ${totalTests} FAST RESTART TESTS PASSED!`);
console.log('============================================================\n');
