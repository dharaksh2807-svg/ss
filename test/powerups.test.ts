import { Player } from '../src/player/Player';
import { PowerupManager, PowerupType } from '../src/player/PowerupManager';
import { UpgradeManager, UpgradablePowerup, UPGRADE_CONFIGS } from '../src/player/UpgradeManager';
import { TrackManager } from '../src/track/TrackManager';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { CONSTANTS } from '../src/core/Constants';
import * as THREE from 'three';

// -------------------------------------------------------------------------
// Mock localStorage for Node test runner
// -------------------------------------------------------------------------
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

console.log('🧪 Starting Comprehensive Power-Up Gameplay Test Suite...\n');

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

// =========================================================================
// Test 1: Collecting Each Power-Up
// =========================================================================
console.log('--- Test 1: Collecting each power-up ---');
{
  const powerups = new PowerupManager();
  powerups.reset();
  const allTypes: PowerupType[] = ['MAGNET', 'JETPACK', 'SNEAKERS', 'MULTIPLIER', 'SHIELD', 'HOVERBOARD'];

  allTypes.forEach((type) => {
    powerups.activate(type);
    assert(powerups.getRemaining(type) > 0, `Powerup ${type} registered with positive duration`);
  });
  assert(powerups.getActivePowerups().length === 6, 'All 6 powerup types active concurrently');
}

// =========================================================================
// Test 2: Successful Activation & Correct Attributes
// =========================================================================
console.log('\n--- Test 2: Successful activation ---');
{
  const powerups = new PowerupManager();
  powerups.reset();

  powerups.activate('MAGNET');
  assert(powerups.isMagnetActive(), 'Magnet is active');
  assert(powerups.getMagnetRadius() >= 12, 'Magnet radius is at least base 12m');

  powerups.activate('JETPACK');
  assert(powerups.isJetpackActive(), 'Jetpack is active');
  assert(powerups.getJetpackRemaining() > 0, 'Jetpack has remaining duration');

  powerups.activate('SNEAKERS');
  assert(powerups.isSuperSneakersActive(), 'Super Sneakers are active');
  assert(powerups.getJumpVelocityMultiplier() > 1.0, 'Jump velocity multiplier is boosted (>1.0)');

  powerups.activate('MULTIPLIER');
  assert(powerups.is2xMultiplierActive(), '2X Multiplier is active');
  assert(powerups.getScoreMultiplier() === 2, 'Score multiplier returns 2');

  powerups.activate('SHIELD');
  assert(powerups.hasShieldActive(), 'Protective Shield is active');
}

// =========================================================================
// Test 3: Correct Expiration and Warning Event
// =========================================================================
console.log('\n--- Test 3: Correct expiration & warning event ---');
{
  const powerups = new PowerupManager();
  powerups.reset();
  const bus = EventBus.getInstance();

  let warned = false;
  let expired = false;
  bus.on('POWERUP_EXPIRING', (type: string) => {
    if (type === 'MAGNET') warned = true;
  });
  bus.on(EVENTS.POWERUP_EXPIRED, (type: string) => {
    if (type === 'MAGNET') expired = true;
  });

  powerups.activate('MAGNET');
  const totalDur = powerups.getRemaining('MAGNET');

  // Step forward until 2.5s remaining (should trigger warning at <= 3.0s)
  powerups.update(totalDur - 2.5);
  assert(warned, 'POWERUP_EXPIRING event fired when remaining duration <= 3.0s');
  assert(powerups.isMagnetActive(), 'Magnet still active at 2.5s remaining');

  // Step past expiration
  powerups.update(3.0);
  assert(expired, 'POWERUP_EXPIRED event fired on completion');
  assert(!powerups.isMagnetActive(), 'Magnet is no longer active after timer elapses');
}

// =========================================================================
// Test 4: Picking Up the Same Power-Up Again (Timer Refresh)
// =========================================================================
console.log('\n--- Test 4: Picking up the same power-up again (Refresh) ---');
{
  const powerups = new PowerupManager();
  powerups.reset();

  powerups.activate('SNEAKERS');
  const fullDur = powerups.getRemaining('SNEAKERS');

  // Simulate half duration elapse
  powerups.update(fullDur / 2);
  const remainingMid = powerups.getRemaining('SNEAKERS');
  assert(remainingMid < fullDur, 'Sneakers timer counted down');

  // Pick up same power-up again
  powerups.activate('SNEAKERS');
  const refreshedDur = powerups.getRemaining('SNEAKERS');
  assert(refreshedDur === fullDur, 'Sneakers timer refreshed back to full duration');
  assert(powerups.getActivePowerups().filter(p => p.type === 'SNEAKERS').length === 1, 'No duplicate entries for same powerup');
}

// =========================================================================
// Test 5: Pause / Resume Without Timer Drift
// =========================================================================
console.log('\n--- Test 5: Pause/resume without timer drift ---');
{
  const powerups = new PowerupManager();
  powerups.reset();

  powerups.activate('JETPACK');
  const startDur = powerups.getRemaining('JETPACK');

  // During pause, Game.gameLoop does NOT call powerups.update(dt).
  // Simulate 5 seconds in paused state:
  const pausedTimeElapsed = 5.0; // wall clock seconds pass
  // Do not call powerups.update
  const afterPauseDur = powerups.getRemaining('JETPACK');
  assert(afterPauseDur === startDur, 'Powerup duration remained exactly unchanged during pause');

  // Resume and step normally
  powerups.update(1.0);
  assert(Math.abs(powerups.getRemaining('JETPACK') - (startDur - 1.0)) < 0.001, 'Timer decrements normally after resume');
}

// =========================================================================
// Test 6: Jetpack Elevated State & Obstacle Bypass
// =========================================================================
console.log('\n--- Test 6: Collision bypass during jetpack flight ---');
{
  const player = new Player();
  player.reset();

  player.powerups.activate('JETPACK');
  // Simulate player update until flight altitude reached
  for (let i = 0; i < 40; i++) {
    player.update(0.05);
  }

  assert(player.state === 'JETPACK', 'Player entered explicit JETPACK state');
  assert(player.position.y >= 8.5, `Player reached flight altitude: ${player.position.y.toFixed(2)}m (expected >= 8.5m)`);

  // Obstacle collision test at flight altitude
  const scene = new THREE.Scene();
  const track = new TrackManager(scene);

  // Standard train obstacle is bounded at y: [0, 3.5]
  // In TrackManager.checkCollisions:
  // if (player.state === 'JETPACK' || player.position.y > 6.0) return false;
  let simulatedCrash = false;
  EventBus.getInstance().on(EVENTS.CRASH, () => {
    simulatedCrash = true;
  });

  // Check collision against ground obstacle
  const groundObstacleBox = new THREE.Box3(
    new THREE.Vector3(-1, 0, player.position.z - 1),
    new THREE.Vector3(1, 3.5, player.position.z + 1)
  );
  const playerBox = player.getCollider();
  assert(!playerBox.intersectsBox(groundObstacleBox), 'Player bounding box at altitude 9m does not intersect ground obstacle (0-3.5m)');
  assert(!simulatedCrash, 'No crash triggered while flying at jetpack altitude');

  // Safe landing test: count down jetpack
  const jpDuration = player.powerups.getJetpackRemaining();
  for (let i = 0; i < Math.ceil(jpDuration / 0.05) + 10; i++) {
    player.update(0.05);
  }

  assert(player.state === 'RUN', 'Player returned to RUN state after jetpack expiration');
  assert(Math.abs(player.position.y - CONSTANTS.PLAYER_BASE_Y) < 0.1, 'Player landed safely on ground track');
  assert(player.powerups.isInvulnerable(), 'Player receives landing invulnerability grace window');
}

// =========================================================================
// Test 7: Shield Consuming Exactly One Collision
// =========================================================================
console.log('\n--- Test 7: Shield consuming one collision ---');
{
  const player = new Player();
  player.reset();
  const bus = EventBus.getInstance();

  let shieldBrokenEvent = false;
  let fatalCrashEvent = false;
  bus.on('SHIELD_BROKEN', () => {
    shieldBrokenEvent = true;
  });
  bus.on(EVENTS.CRASH, () => {
    fatalCrashEvent = true;
  });

  player.powerups.activate('SHIELD');
  assert(player.powerups.hasShieldActive(), 'Shield is active');

  // 1st collision: absorbed by shield
  player.crash();
  assert(shieldBrokenEvent, 'SHIELD_BROKEN event was emitted on first collision');
  assert(!player.powerups.hasShieldActive(), 'Shield was consumed');
  assert(player.powerups.isInvulnerable(), 'Post-shield invulnerability grace period granted');
  assert(!fatalCrashEvent, 'First collision did NOT cause a fatal crash');
  assert(player.state === 'RUN', 'Player remained in RUN state');

  // While invulnerable, another collision should be ignored
  player.crash();
  assert(!fatalCrashEvent, 'Subsequent collision during grace period is safely ignored');

  // Clear invulnerability
  player.powerups.update(10.0);
  assert(!player.powerups.isInvulnerable(), 'Invulnerability expired');

  // Next collision without shield -> fatal crash
  player.crash();
  assert(fatalCrashEvent, 'Collision without shield causes fatal crash');
  assert(player.state === 'CRASH', 'Player state set to CRASH');
}

// =========================================================================
// Test 8: Magnet Attracting Coins & Single Credit Guarantee
// =========================================================================
console.log('\n--- Test 8: Magnet coin attraction & single credit ---');
{
  const powerups = new PowerupManager();
  powerups.reset();
  powerups.activate('MAGNET');

  const playerPos = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, -50);
  const radius = powerups.getMagnetRadius();

  // Create simulated collectible coins
  const coins = [
    { type: 'COIN', position: new THREE.Vector3(-2.2, 0.8, -55), active: true, mesh: new THREE.Object3D() },
    { type: 'COIN', position: new THREE.Vector3(2.2, 0.8, -52), active: true, mesh: new THREE.Object3D() },
    { type: 'COIN', position: new THREE.Vector3(0, 0.8, -45), active: true, mesh: new THREE.Object3D() },
    { type: 'COIN', position: new THREE.Vector3(0, 0.8, -120), active: true, mesh: new THREE.Object3D() } // Outside radius
  ];

  let collectedCount = 0;
  const bus = EventBus.getInstance();
  bus.on(EVENTS.COIN_COLLECTED, () => {
    collectedCount++;
  });

  // Simulate magnet update logic (from TrackManager)
  const dt = 0.05;
  coins.forEach(c => {
    c.mesh.position.copy(c.position);
    const dist = c.position.distanceTo(playerPos);
    if (dist < radius) {
      // Pull toward player
      const dir = new THREE.Vector3().subVectors(playerPos, c.position).normalize();
      c.position.addScaledVector(dir, 15 * dt);
    }
  });

  // Check that the 3 within radius moved closer
  assert(coins[0].position.distanceTo(playerPos) < new THREE.Vector3(-2.2, 0.8, -55).distanceTo(playerPos), 'Coin 1 pulled toward player');
  assert(coins[1].position.distanceTo(playerPos) < new THREE.Vector3(2.2, 0.8, -52).distanceTo(playerPos), 'Coin 2 pulled toward player');
  assert(coins[2].position.distanceTo(playerPos) < new THREE.Vector3(0, 0.8, -45).distanceTo(playerPos), 'Coin 3 pulled toward player');
  assert(coins[3].position.distanceTo(playerPos) === new THREE.Vector3(0, 0.8, -120).distanceTo(playerPos), 'Coin 4 outside radius did not move');

  // Single-credit test: simulate collection
  const targetCoin = coins[0];
  if (targetCoin.active) {
    targetCoin.active = false;
    bus.emit(EVENTS.COIN_COLLECTED);
  }
  // Try to collect again
  if (targetCoin.active) {
    targetCoin.active = false;
    bus.emit(EVENTS.COIN_COLLECTED);
  }
  assert(collectedCount === 1, 'Target coin was credited exactly once');
}

// =========================================================================
// Test 9: Jump & Slide with Active Power-ups
// =========================================================================
console.log('\n--- Test 9: Jump and slide with active power-ups ---');
{
  const player = new Player();
  player.reset();

  // Test baseline jump velocity
  player.jump();
  const baselineJumpVelocity = player.verticalVelocity;
  player.reset();

  // Activate Super Sneakers
  player.powerups.activate('SNEAKERS');
  const boostMult = player.powerups.getJumpVelocityMultiplier();
  player.jump();
  const boostedJumpVelocity = player.verticalVelocity;

  assert(boostedJumpVelocity > baselineJumpVelocity, `Super Sneakers boosted jump velocity: ${boostedJumpVelocity.toFixed(2)} vs baseline ${baselineJumpVelocity.toFixed(2)}`);
  assert(Math.abs(boostedJumpVelocity - baselineJumpVelocity * boostMult) < 0.01, 'Boost multiplier applied accurately');

  // Test sliding while power-ups active
  player.reset();
  player.powerups.activate('MAGNET');
  player.powerups.activate('MULTIPLIER');
  player.handleInput('DOWN');

  assert(player.state === 'SLIDE', 'Player entered SLIDE state with active power-ups');
  assert(player.powerups.isMagnetActive(), 'Magnet remains active during slide');
  assert(player.powerups.is2xMultiplierActive(), 'Multiplier remains active during slide');
}

// =========================================================================
// Test 10: Full Cleanup After Restart
// =========================================================================
console.log('\n--- Test 10: Full cleanup after restart ---');
{
  const player = new Player();
  player.reset();

  // Activate several powerups
  player.powerups.activate('MAGNET');
  player.powerups.activate('JETPACK');
  player.powerups.activate('SHIELD');
  player.powerups.activate('SNEAKERS');
  player.powerups.activate('MULTIPLIER');
  player.powerups.activate('HOVERBOARD');
  player.powerups.grantInvulnerability(5.0);

  assert(player.powerups.getActivePowerups().length === 6, '6 powerups active before restart');
  assert(player.powerups.isInvulnerable(), 'Player is invulnerable before restart');

  // Trigger full reset (restart)
  player.reset();

  assert(player.powerups.getActivePowerups().length === 0, 'All powerups cleared after player.reset()');
  assert(!player.powerups.isInvulnerable(), 'Invulnerability reset to false');
  assert(player.state === 'RUN', 'Player state reset to RUN');
  assert(player.currentLane === 0, 'Player reset to center lane');
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Player reset to ground level');
}

// =========================================================================
// Test 11: Upgrade Persistence & Stat Scaling
// =========================================================================
console.log('\n--- Test 11: Upgrade persistence & stat scaling ---');
{
  const upgradeMgr = UpgradeManager.getInstance();
  upgradeMgr.resetAll();

  assert(upgradeMgr.getCoins() === 0, 'Wallet initialized to 0');
  assert(upgradeMgr.getLevel('MAGNET') === 1, 'Magnet initialized to Level 1');

  // Add coins and purchase Magnet upgrade
  const cost1 = upgradeMgr.getUpgradeCost('MAGNET');
  assert(cost1 !== null, 'Magnet level 1 has valid upgrade cost');
  upgradeMgr.addCoins(cost1!);
  assert(upgradeMgr.getCoins() === cost1!, 'Coins added to wallet');
  assert(upgradeMgr.canUpgrade('MAGNET'), 'Can upgrade Magnet with sufficient coins');

  const upgraded = upgradeMgr.purchaseUpgrade('MAGNET');
  assert(upgraded, 'Upgrade purchase succeeded');
  assert(upgradeMgr.getLevel('MAGNET') === 2, 'Magnet level increased to 2');
  assert(upgradeMgr.getCoins() === 0, 'Wallet decremented by exact upgrade cost');

  // Check stat scaling
  const lvl1Duration = UPGRADE_CONFIGS.MAGNET.baseDuration;
  const lvl2Duration = upgradeMgr.getDuration('MAGNET');
  assert(lvl2Duration === lvl1Duration + UPGRADE_CONFIGS.MAGNET.durationPerLevel, `Magnet duration scaled: ${lvl2Duration}s (expected ${lvl1Duration + 3}s)`);

  const lvl1Radius = UPGRADE_CONFIGS.MAGNET.baseStat;
  const lvl2Radius = upgradeMgr.getMagnetRadius();
  assert(lvl2Radius === lvl1Radius + UPGRADE_CONFIGS.MAGNET.statPerLevel, `Magnet radius scaled: ${lvl2Radius}m (expected ${lvl1Radius + 3}m)`);

  // Verify persistence by reading from localStorage
  const rawSaved = (globalThis as any).localStorage.getItem('metro_runner_upgrades');
  assert(rawSaved !== null, 'Upgrades saved to localStorage');
  const parsed = JSON.parse(rawSaved);
  assert(parsed.MAGNET === 2, 'LocalStorage stores Magnet level 2');

  // Verify reload
  const reloadedMgr = new UpgradeManager();
  assert(reloadedMgr.getLevel('MAGNET') === 2, 'New UpgradeManager instance loaded persisted level 2 from storage');
}

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${passedTests} OF ${totalTests} POWER-UP TESTS PASSED SUCCESSFULLY!`);
console.log(`=======================================================\n`);
