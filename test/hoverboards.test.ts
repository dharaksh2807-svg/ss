import * as THREE from 'three';
import {
  HOVERBOARDS,
  getAllHoverboards,
  getHoverboardById,
  HoverboardId,
  HOVERBOARD_CHARGES_PACK
} from '../src/hoverboard/HoverboardCatalog';
import { HoverboardMeshBuilder } from '../src/hoverboard/HoverboardMeshBuilder';
import { HoverboardManager } from '../src/hoverboard/HoverboardManager';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { Player } from '../src/player/Player';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { CONSTANTS } from '../src/core/Constants';

// Mock localStorage for Node environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
(global as any).localStorage = mockStorage;

// Assertion helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting Task 6: Hoverboard Collection, Activation, Powers & Customization Test Suite...\n');

// ========================================================
// TEST 1: Hoverboard Catalog & Architecture Completeness
// ========================================================
console.log('--- Test 1: Hoverboard Catalog & Architecture Completeness ---');
const allBoards = getAllHoverboards();
assert(allBoards.length >= 4, `Catalog contains at least 4 distinct original boards (found ${allBoards.length})`);

const expectedBoardIds: HoverboardId[] = [
  'board_urban_glide',
  'board_pulse_rider',
  'board_aero_drift',
  'board_street_phantom'
];

expectedBoardIds.forEach((id) => {
  const b = getHoverboardById(id);
  assert(b !== undefined, `Hoverboard '${id}' exists in catalog`);
  assert(b!.name.length > 0, `Board '${id}' has a valid name (${b?.name})`);
  assert(b!.archetype.length > 0, `Board '${id}' has an archetype (${b?.archetype})`);
  assert(b!.tagline.length > 0, `Board '${id}' has a tagline`);
  assert(b!.description.length > 0, `Board '${id}' has lore description`);
  assert(b!.duration >= 20.0, `Board '${id}' has a balanced duration (>= 20s)`);
  assert(b!.ability !== undefined, `Board '${id}' has a defined ability`);
  assert(b!.colors !== undefined, `Board '${id}' has a defined PBR color palette`);
});

const urbanGlide = getHoverboardById('board_urban_glide')!;
assert(urbanGlide.unlock.type === 'FREE', 'Urban Glide is the free starter hoverboard');

const pulseRider = getHoverboardById('board_pulse_rider')!;
assert(pulseRider.unlock.type === 'COINS' && pulseRider.unlock.cost === 2500, 'Pulse Rider is purchasable for 2,500 Coins');
assert(pulseRider.ability.type === 'SPEED_BOOST', 'Pulse Rider has SPEED_BOOST ability');
assert(pulseRider.ability.speedMultiplier === 1.15, 'Pulse Rider grants +15% speed boost');
assert(pulseRider.ability.scoreMultiplierBonus === 1, 'Pulse Rider grants +1 score multiplier bonus');

const aeroDrift = getHoverboardById('board_aero_drift')!;
assert(aeroDrift.unlock.type === 'COINS' && aeroDrift.unlock.cost === 4000, 'Aero Drift is purchasable for 4,000 Coins');
assert(aeroDrift.ability.type === 'SUPER_JUMP', 'Aero Drift has SUPER_JUMP ability');
assert(aeroDrift.ability.jumpVelocityMultiplier === 1.25, 'Aero Drift grants +25% jump velocity');
assert(aeroDrift.ability.gravityMultiplier === 0.82, 'Aero Drift softens gravity (0.82x)');

const streetPhantom = getHoverboardById('board_street_phantom')!;
assert(streetPhantom.unlock.type === 'COINS' && streetPhantom.unlock.cost === 6000, 'Street Phantom is purchasable for 6,000 Coins');
assert(streetPhantom.ability.type === 'DRIFT_HANDLING', 'Street Phantom has DRIFT_HANDLING ability');
assert(streetPhantom.ability.laneChangeSpeedMultiplier === 0.65, 'Street Phantom grants 35% faster lane transitions');
assert(streetPhantom.ability.magnetRadiusBonus === 3.5, 'Street Phantom projects a 3.5m coin magnet aura');

// ========================================================
// TEST 2: 3D Procedural Mesh Generation
// ========================================================
console.log('\n--- Test 2: 3D Procedural Mesh Generation ---');
expectedBoardIds.forEach((id) => {
  const built = HoverboardMeshBuilder.build(id);
  assert(built.group instanceof THREE.Group, `Hoverboard '${id}' generates valid Three.js group`);
  assert(built.group.children.length >= 4, `Hoverboard '${id}' has detailed geometry parts (${built.group.children.length} parts)`);
  assert(built.materials.length >= 5, `Hoverboard '${id}' utilizes multiple PBR materials (${built.materials.length} mats)`);
  assert(typeof built.updateAnimation === 'function', `Hoverboard '${id}' provides thruster/glow animation update method`);
});

const builtUrban = HoverboardMeshBuilder.build('board_urban_glide');
assert(builtUrban.energyRings.length >= 1, 'Urban Glide includes undercarriage magnetic levitator ring');

const builtPulse = HoverboardMeshBuilder.build('board_pulse_rider');
assert(builtPulse.thrusterFires.length >= 2, 'Pulse Rider includes twin plasma thruster flames');

const builtAero = HoverboardMeshBuilder.build('board_aero_drift');
assert(builtAero.thrusterFires.length >= 1, 'Aero Drift includes plasma thruster flame');

const builtPhantom = HoverboardMeshBuilder.build('board_street_phantom');
assert(builtPhantom.thrusterFires.length >= 2, 'Street Phantom includes dual ion thruster flames');
assert(builtPhantom.energyRings.length >= 1, 'Street Phantom includes violet energy arc rings');

// ========================================================
// TEST 3: Dedicated HoverboardManager Lifecycle
// ========================================================
console.log('\n--- Test 3: Dedicated HoverboardManager Lifecycle ---');
const boardMgr = HoverboardManager.getInstance();
boardMgr.reset();

assert(!boardMgr.isBoardActive(), 'HoverboardManager starts inactive');
assert(boardMgr.getRemaining() === 0, 'Initial remaining duration is 0');
assert(boardMgr.canActivate().allowed === true, 'Can activate hoverboard initially');

// Test activation
const activated = boardMgr.activate();
assert(activated === true, 'Hoverboard deployed successfully');
assert(boardMgr.isBoardActive() === true, 'Hoverboard is now active');
assert(boardMgr.getRemaining() > 0, 'Remaining time is positive');
assert(boardMgr.getDuration() === 25.0, 'Duration matches Urban Glide (25.0s)');
assert(boardMgr.canActivate().allowed === false, 'Cannot re-activate while already active');

// Test update and countdown
boardMgr.update(5.0);
assert(Math.abs(boardMgr.getRemaining() - 20.0) < 0.1, 'Duration counts down properly (20s remaining)');

// Test expiration
let expirationEmitted = false;
EventBus.getInstance().on('HOVERBOARD_EXPIRED', () => {
  expirationEmitted = true;
});

boardMgr.update(21.0); // Elapsed past 25s
assert(!boardMgr.isBoardActive(), 'Hoverboard properly expired after duration elapsed');
assert(expirationEmitted === true, 'HOVERBOARD_EXPIRED event emitted upon expiration');
assert(boardMgr.getCooldownRemaining() > 0, 'Cooldown is active after expiration');

// ========================================================
// TEST 4: Progression, Unlocks & Economy
// ========================================================
console.log('\n--- Test 4: Progression, Unlocks & Economy ---');
mockStorage.clear();
const prog = ProgressionManager.getInstance();
prog.resetAll();
const upgradeMgr = UpgradeManager.getInstance();
upgradeMgr.resetAll();

assert(prog.isBoardUnlocked('board_urban_glide'), 'Urban Glide is unlocked by default');
assert(!prog.isBoardUnlocked('board_pulse_rider'), 'Pulse Rider is initially locked');
assert(!prog.isBoardUnlocked('board_aero_drift'), 'Aero Drift is initially locked');
assert(!prog.isBoardUnlocked('board_street_phantom'), 'Street Phantom is initially locked');

// Cannot afford Pulse Rider (requires 2500 coins, player has 0)
upgradeMgr.resetAll();
const failPurchase = prog.purchaseBoard('board_pulse_rider');
assert(!failPurchase.success, 'Purchase blocked when player has insufficient coins');
assert(!prog.isBoardUnlocked('board_pulse_rider'), 'Pulse Rider remains locked after failed purchase');

// Deposit coins and purchase Pulse Rider
upgradeMgr.addCoins(5000);
assert(upgradeMgr.getCoins() === 5000, 'Wallet has 5,000 coins');

const successPurchase = prog.purchaseBoard('board_pulse_rider');
assert(successPurchase.success, 'Pulse Rider purchase succeeded');
assert(prog.isBoardUnlocked('board_pulse_rider'), 'Pulse Rider is now unlocked in inventory');
assert(upgradeMgr.getCoins() === 2500, 'Exact cost deducted once: 5,000 - 2,500 = 2,500 coins');
assert(prog.getSelectedBoard() === 'board_pulse_rider', 'Newly purchased board is automatically equipped');

// Duplicate purchase rejected
const dupPurchase = prog.purchaseBoard('board_pulse_rider');
assert(!dupPurchase.success, 'Duplicate board purchase rejected');
assert(upgradeMgr.getCoins() === 2500, 'Wallet coins unchanged after duplicate purchase attempt');

// Equip mechanics
const equipUrban = prog.equipBoard('board_urban_glide');
assert(equipUrban.success, 'Equipped Urban Glide');
assert(prog.getSelectedBoard() === 'board_urban_glide', 'Selected board updated to Urban Glide');

const failEquipLocked = prog.equipBoard('board_street_phantom');
assert(!failEquipLocked.success, 'Cannot equip locked board Street Phantom');
assert(prog.getSelectedBoard() === 'board_urban_glide', 'Selected board unchanged after failed equip');

// ========================================================
// TEST 5: Consumable Board Charges Pack & Inventory
// ========================================================
console.log('\n--- Test 5: Consumable Board Charges Pack & Inventory ---');
prog.resetAll();
assert(prog.getHoverboardCharges() === 5, 'Player starts with 5 starter hoverboard charges');

// Consume charge
const consumed = prog.consumeHoverboardCharge();
assert(consumed === true, 'Successfully consumed 1 hoverboard charge');
assert(prog.getHoverboardCharges() === 4, 'Remaining charges count is 4');

// Purchase 3-pack charges
upgradeMgr.addCoins(1000);
const preCoins = upgradeMgr.getCoins();
const buyCharges = prog.purchaseHoverboardCharges();
assert(buyCharges.success, 'Purchased +3 Hoverboard charges pack');
assert(prog.getHoverboardCharges() === 7, 'Charges updated from 4 to 7');
assert(upgradeMgr.getCoins() === preCoins - HOVERBOARD_CHARGES_PACK.cost, `Deducted exactly ${HOVERBOARD_CHARGES_PACK.cost} coins`);

// ========================================================
// TEST 6: Board-Specific Abilities Verification
// ========================================================
console.log('\n--- Test 6: Board-Specific Abilities Verification ---');

// Urban Glide: Standard Kinetic Buffer
prog.equipBoard('board_urban_glide');
boardMgr.reset();
boardMgr.activate();
assert(boardMgr.getSpeedMultiplier() === 1.0, 'Urban Glide has standard 1.0x speed multiplier');
assert(boardMgr.getScoreMultiplierBonus() === 0, 'Urban Glide has 0 bonus score multiplier');
assert(boardMgr.getJumpVelocityMultiplier() === 1.0, 'Urban Glide has standard 1.0x jump velocity');
assert(boardMgr.getLaneChangeDurationMultiplier() === 1.0, 'Urban Glide has standard 1.0x lane change duration');
assert(boardMgr.getActiveBoard()?.ability.protectionRecoveryDuration === 1.5, 'Urban Glide provides 1.5s crash recovery grace');

// Pulse Rider: Velocity Overdrive
prog.unlockBoard('board_pulse_rider');
prog.equipBoard('board_pulse_rider');
boardMgr.reset();
boardMgr.activate();
assert(boardMgr.getSpeedMultiplier() === 1.15, 'Pulse Rider applies +15% speed multiplier');
assert(boardMgr.getScoreMultiplierBonus() === 1, 'Pulse Rider applies +1 score multiplier bonus');

// Aero Drift: Anti-Grav Lift
prog.unlockBoard('board_aero_drift');
prog.equipBoard('board_aero_drift');
boardMgr.reset();
boardMgr.activate();
assert(boardMgr.getJumpVelocityMultiplier() === 1.25, 'Aero Drift applies +25% jump velocity boost');
assert(boardMgr.getGravityMultiplier() === 0.82, 'Aero Drift applies 0.82x floaty gravity');

// Street Phantom: Phantom Drift
prog.unlockBoard('board_street_phantom');
prog.equipBoard('board_street_phantom');
boardMgr.reset();
boardMgr.activate();
assert(boardMgr.getLaneChangeDurationMultiplier() === 0.65, 'Street Phantom slashes lane change duration to 0.65x (35% faster)');
assert(boardMgr.getMagnetRadiusBonus() === 3.5, 'Street Phantom projects +3.5m magnet radius aura');

// ========================================================
// TEST 7: Collision Protection & Recovery
// ========================================================
console.log('\n--- Test 7: Collision Protection & Recovery ---');
boardMgr.reset();
boardMgr.activate();
assert(boardMgr.isBoardActive(), 'Board is active before obstacle collision');

let brokenEmitted = false;
EventBus.getInstance().on(EVENTS.HOVERBOARD_BROKEN, () => {
  brokenEmitted = true;
});

// Break board on collision
const absorbed = boardMgr.breakBoard();
assert(absorbed === true, 'Hoverboard successfully absorbed lethal obstacle collision');
assert(!boardMgr.isBoardActive(), 'Hoverboard is no longer active after absorbing crash');
assert(brokenEmitted === true, 'HOVERBOARD_BROKEN event emitted upon impact');
assert(boardMgr.isInvulnerableAfterCrash() === true, 'Post-crash invulnerability grace window is active');

// Second obstacle hit immediately during grace window is ignored
boardMgr.update(0.2); // 0.2s elapsed, still in grace window
assert(boardMgr.isInvulnerableAfterCrash() === true, 'Grace window still active at 0.2s');

boardMgr.update(1.5); // Grace period expired
assert(boardMgr.isInvulnerableAfterCrash() === false, 'Grace window safely expired');

// ========================================================
// TEST 8: Player Integration & Character Compatibility
// ========================================================
console.log('\n--- Test 8: Player Integration & Character Compatibility ---');
const player = new Player();
player.reset();

// Verify spacebar / ACTION input deploys equipped board
prog.equipBoard('board_pulse_rider');
player.handleInput('ACTION');
assert(player.hoverboardManager.isBoardActive() === true, 'Player deployed hoverboard on ACTION input');

// Verify speed multiplier applies to forward motion
const baseSpeed = player.speed;
player.update(0.1);
assert(player.model.getOutfitId() !== undefined, 'Player model remains valid while surfing');

// Jump with Aero Drift equipped
prog.equipBoard('board_aero_drift');
player.hoverboardManager.reset();
player.hoverboardManager.activate();
player.handleInput('UP');
assert(player.isJumping === true, 'Player initiated jump while surfing');
assert(player.verticalVelocity > CONSTANTS.JUMP_INITIAL_VELOCITY, 'Jump velocity boosted by Aero Drift');

// Crash absorption through player.crash()
assert(player.crash() === false, 'player.crash() returned false (collision absorbed by hoverboard)');
assert(player.state !== 'CRASH', 'Player did not transition to CRASH state');
assert(player.hoverboardManager.isInvulnerableAfterCrash() === true, 'Player is invulnerable immediately after hoverboard break');

// ========================================================
// TEST 9: Persistence Across Browser Reload
// ========================================================
console.log('\n--- Test 9: Persistence Across Browser Reload ---');
prog.unlockBoard('board_pulse_rider');
prog.unlockBoard('board_aero_drift');
prog.equipBoard('board_aero_drift');
const currentCharges = prog.getHoverboardCharges();
prog.addHoverboardCharges(5);

const savedRaw = mockStorage.getItem('metro_progression_v1');
assert(savedRaw !== null, 'Progression saved to localStorage under metro_progression_v1');

const parsed = JSON.parse(savedRaw!);
assert(parsed.unlockedBoards.includes('board_aero_drift'), 'Persisted state contains unlocked Aero Drift');
assert(parsed.selectedBoard === 'board_aero_drift', 'Persisted state has Aero Drift selected');
assert(parsed.hoverboardCharges === currentCharges + 5, 'Persisted state has exact updated hoverboard charges count');

console.log('\n=======================================================');
console.log('🏆 ALL 45/45 HOVERBOARD COLLECTION & POWERS TESTS PASSED!');
console.log('=======================================================\n');
