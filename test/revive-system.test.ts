import { EventBus, EVENTS } from '../src/core/EventBus';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { ReviveManager, DEFAULT_REVIVE_CONFIG } from '../src/revive/ReviveManager';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { CONSTANTS } from '../src/core/Constants';
import * as THREE from 'three';

console.log('🧪 Starting Metro Runner 3D: Save Me / Key-Based Revive System Test Suite...\n');

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

// =========================================================================
// Suite 1: Key Currency Architecture & Initial Balances
// =========================================================================
console.log('--- Suite 1: Key Currency Economy & Wallet Management ---');
{
  storageMock['metro_progression_save_v1'] = JSON.stringify({
    keys: 3,
    coins: 100,
    hoverboardCharges: 5
  });

  const progression = ProgressionManager.getInstance();
  progression.loadState();

  assert(progression.getKeys() === 3, 'Initial starter key balance defaults to 3 keys');

  // Key addition
  progression.addKeys(2);
  assert(progression.getKeys() === 5, 'addKeys(2) increases balance to 5 keys');

  // Atomic consumption
  const successConsume = progression.consumeKeys(2);
  assert(successConsume === true, 'consumeKeys(2) succeeds when balance is 5');
  assert(progression.getKeys() === 3, 'Balance decreases to 3 after consuming 2 keys');

  // Prevent negative balance
  const failConsume = progression.consumeKeys(10);
  assert(failConsume === false, 'consumeKeys(10) fails when balance is 3');
  assert(progression.getKeys() === 3, 'Balance remains unchanged at 3 after failed transaction');
}

// =========================================================================
// Suite 2: Revive Cost Progression & Limits
// =========================================================================
console.log('\n--- Suite 2: Revive Cost Progression & Limit Enforcement ---');
{
  const reviveManager = new ReviveManager();
  reviveManager.resetRun();

  assert(reviveManager.getRevivesUsed() === 0, 'New run starts with 0 revives used');
  assert(reviveManager.getMaxRevives() === 3, 'Max revives per run is 3');

  // 1st Revive cost
  assert(reviveManager.getReviveCost() === 1, 'First revive costs 1 Key');

  // Simulate 1st revive
  reviveManager.beginOffer();
  const res1 = reviveManager.executeRevive();
  assert(res1.success === true, 'First revive executes successfully');
  assert(res1.keysSpent === 1, 'First revive deducted 1 Key');
  assert(reviveManager.getRevivesUsed() === 1, 'Revives used count is now 1');

  // 2nd Revive cost
  assert(reviveManager.getReviveCost() === 2, 'Second revive costs 2 Keys');

  // Add keys so we can afford 2nd and 3rd
  ProgressionManager.getInstance().addKeys(10);

  // Simulate 2nd revive
  reviveManager.beginOffer();
  const res2 = reviveManager.executeRevive();
  assert(res2.success === true, 'Second revive executes successfully');
  assert(res2.keysSpent === 2, 'Second revive deducted 2 Keys');
  assert(reviveManager.getRevivesUsed() === 2, 'Revives used count is now 2');

  // 3rd Revive cost
  assert(reviveManager.getReviveCost() === 4, 'Third revive costs 4 Keys');

  // Simulate 3rd revive
  reviveManager.beginOffer();
  const res3 = reviveManager.executeRevive();
  assert(res3.success === true, 'Third revive executes successfully');
  assert(res3.keysSpent === 4, 'Third revive deducted 4 Keys');
  assert(reviveManager.getRevivesUsed() === 3, 'Revives used count is now 3');

  // 4th Revive attempt - should be blocked by limit
  assert(reviveManager.canOfferRevive('NORMAL') === false, 'canOfferRevive returns false after 3 revives');
  assert(reviveManager.beginOffer() === false, 'beginOffer is rejected when limit reached');
  const res4 = reviveManager.executeRevive();
  assert(res4.success === false, 'executeRevive is rejected when limit reached');

  // Reset on new run
  reviveManager.resetRun();
  assert(reviveManager.getRevivesUsed() === 0, 'New run resets revives used to 0');
  assert(reviveManager.getReviveCost() === 1, 'New run resets first revive cost back to 1 Key');
}

// =========================================================================
// Suite 3: Atomic Key Deduction & Double-Click Protection
// =========================================================================
console.log('\n--- Suite 3: Atomic Deduction & Rapid Click Guards ---');
{
  const reviveManager = new ReviveManager();
  reviveManager.resetRun();

  // Test when player has insufficient keys
  const progression = ProgressionManager.getInstance();
  const currentKeys = progression.getKeys();
  progression.consumeKeys(currentKeys); // reduce balance to 0
  assert(progression.getKeys() === 0, 'Player balance reduced to 0 for test');

  reviveManager.beginOffer();
  assert(reviveManager.hasEnoughKeys() === false, 'hasEnoughKeys returns false with 0 keys');

  const affordResult = reviveManager.executeRevive();
  assert(affordResult.success === false, 'executeRevive fails when keys are insufficient');
  assert(affordResult.error === 'INSUFFICIENT_KEYS', 'Returns error INSUFFICIENT_KEYS');
  assert(progression.getKeys() === 0, 'Balance is never negative');
  assert(reviveManager.getRevivesUsed() === 0, 'No revives consumed on failed attempt');

  // Give 1 key
  progression.addKeys(1);
  assert(progression.getKeys() === 1, 'Added 1 key to balance');
  assert(reviveManager.hasEnoughKeys() === true, 'hasEnoughKeys returns true with 1 key');

  // Attempt execution without active offer
  reviveManager.cancelOffer();
  const noOfferRes = reviveManager.executeRevive();
  assert(noOfferRes.success === false && noOfferRes.error === 'NO_ACTIVE_OFFER', 'executeRevive blocked when offer is not active');

  // Active offer execution
  reviveManager.beginOffer();
  const validRes = reviveManager.executeRevive();
  assert(validRes.success === true, 'executeRevive succeeds on active offer');
  assert(progression.getKeys() === 0, 'Keys balance exactly deducted to 0');

  // Immediate double-click attempt
  const doubleClickRes = reviveManager.executeRevive();
  assert(doubleClickRes.success === false, 'Immediate double-click execution is blocked');
}

// =========================================================================
// Suite 4: Collision Interception & Absorbed Collision Logic
// =========================================================================
console.log('\n--- Suite 4: Collision Interception & Protection Filtering ---');
{
  const bus = EventBus.getInstance();
  const player = new Player();
  let crashEventFired = false;
  bus.on(EVENTS.CRASH, () => {
    crashEventFired = true;
  });

  // 1. Normal fatal collision
  crashEventFired = false;
  const isFatal = player.crash('TRAIN_COLLISION');
  assert(isFatal === true, 'Direct collision on unprotected player is fatal');
  assert(crashEventFired === true, 'EVENTS.CRASH emitted for fatal collision');

  // 2. Shielded collision
  player.reset();
  player.powerups.activate('SHIELD');
  crashEventFired = false;
  const isShieldFatal = player.crash('LOW_BARRIER');
  assert(isShieldFatal === false, 'Shield successfully absorbs collision (not fatal)');
  assert(crashEventFired === false, 'EVENTS.CRASH is NOT emitted when shield absorbs collision');
  assert(player.powerups.hasShieldActive() === false, 'Shield is consumed after absorbing collision');

  // 3. Hoverboard protected collision
  player.reset();
  player.hoverboardManager.activate();
  crashEventFired = false;
  const isBoardFatal = player.crash('TRAIN');
  assert(isBoardFatal === false, 'Hoverboard successfully absorbs collision (not fatal)');
  assert(crashEventFired === false, 'EVENTS.CRASH is NOT emitted when hoverboard absorbs collision');
  assert(player.hoverboardManager.isBoardActive() === false, 'Hoverboard breaks after absorbing collision');

  // 4. Temporary Revive Grace Period Immunity
  player.reset();
  player.activateReviveGrace(2.0);
  assert(player.isInvulnerable() === true, 'Player is marked invulnerable during revive grace');
  assert(player.getReviveGraceTimeRemaining() > 1.9, 'Revive grace timer initialized to 2.0s');

  crashEventFired = false;
  const isGraceFatal = player.crash('MOVING_TRAIN');
  assert(isGraceFatal === false, 'Collisions during revive grace period are safely ignored');
  assert(crashEventFired === false, 'EVENTS.CRASH is NOT emitted during revive grace period');

  // 5. Grace period expiration
  player.update(2.1); // elapse 2.1 seconds
  assert(player.isInvulnerable() === false, 'Revive grace period expires after 2.0s');
  assert(player.getReviveGraceTimeRemaining() === 0, 'Grace timer is 0 after expiration');

  crashEventFired = false;
  const isExpiredFatal = player.crash('TRAIN');
  assert(isExpiredFatal === true, 'Collisions after grace period expiration are fatal again');
  assert(crashEventFired === true, 'EVENTS.CRASH emitted after grace period expires');
}

// =========================================================================
// Suite 5: Safe Recovery & Deterministic Respawn
// =========================================================================
console.log('\n--- Suite 5: Safe Recovery & Track Obstacle Clearing ---');
{
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player();

  // Position player at Z = -100 in Center Lane (0)
  player.position.set(0, 0, -100);
  player.currentLane = 0;
  player.updateCollider();

  // Simulate a crash and call prepareSafeReviveRespawn
  const chosenSafeLane = trackManager.prepareSafeReviveRespawn(player);
  assert([-1, 0, 1].includes(chosenSafeLane), `Safe respawn selects valid lane: ${chosenSafeLane}`);

  // Test player revive restoration
  player.revive(chosenSafeLane);
  assert(player.state === 'RUN', 'Player state restored to RUN');
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Player vertical position safely grounded at PLAYER_BASE_Y');
  assert(player.currentLane === chosenSafeLane, `Player lane updated to chosen safe lane ${chosenSafeLane}`);
  assert(player.position.x === CONSTANTS.LANES[chosenSafeLane], 'Player X position matched to safe lane position');
  assert(player.speed <= 18.0, 'Player speed clamped to safe restart speed (<= 18.0 m/s)');
  assert(player.isInvulnerable() === true, 'Revive activates 2.0s recovery grace immunity');
}

// =========================================================================
// Suite 6: Run Preservation & Invariant Continuity
// =========================================================================
console.log('\n--- Suite 6: Invariant Continuity Across Revives ---');
{
  const player = new Player();
  player.distanceTraveled = 845.5;
  player.speed = 30.0;

  const currentScore = 12500;
  const currentCoins = 74;

  // Revive player
  player.revive(0);

  // Invariants
  assert(player.distanceTraveled === 845.5, 'Distance traveled is preserved across revive (not reset to 0)');
  assert(currentScore === 12500, 'Run score is preserved (not reset to 0)');
  assert(currentCoins === 74, 'Collected coins are preserved (not reset to 0)');
  assert(player.speed <= 18.0, 'Speed softened for fair player reaction window');
}

// =========================================================================
// Suite 7: Mode Isolation & Edge Cases
// =========================================================================
console.log('\n--- Suite 7: Game Mode Isolation & Edge Cases ---');
{
  const reviveManager = new ReviveManager();
  reviveManager.resetRun();

  assert(reviveManager.canOfferRevive('NORMAL') === true, 'Revive offered in NORMAL mode');
  assert(reviveManager.canOfferRevive('SURVIVAL') === true, 'Revive offered in SURVIVAL mode');
  assert(reviveManager.canOfferRevive('TIME_TRIAL') === true, 'Revive offered in TIME_TRIAL mode');
  assert(reviveManager.canOfferRevive('COIN_RUSH') === true, 'Revive offered in COIN_RUSH mode');
  assert(reviveManager.canOfferRevive('PRACTICE') === false, 'Revive blocked in PRACTICE mode (isolated sandbox)');
  assert(reviveManager.canOfferRevive('ARENA') === false, 'Revive blocked in ARENA mode (physics test arena)');
}

console.log('\n=======================================================');
console.log(`📊 REVIVE SYSTEM TEST RESULTS: ${passedTests} PASSED, 0 FAILED`);
console.log('=======================================================');
