import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import {
  CHARACTER_CATALOG,
  getAllCharacters,
  getCharacterById,
  getOutfitById
} from '../src/characters/CharacterCatalog';
import { CharacterMeshBuilder } from '../src/characters/CharacterMeshBuilder';
import { CharacterModel } from '../src/player/CharacterModel';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { Player } from '../src/player/Player';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';

// Mock localStorage for Node test environment
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

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting Rahul Gandhi Premium Character & Free Trials Integration Test Suite...\n');

// ========================================================
// TEST 1: Physical Asset Integrity
// ========================================================
console.log('--- Test 1: Physical Asset Integrity ---');
const glbPath = path.resolve('public/characters/rahul_gandhi/character.glb');
assert(fs.existsSync(glbPath), `GLB model exists at ${glbPath}`);
const glbStat = fs.statSync(glbPath);
assert(glbStat.size >= 1_000_000, `GLB size is ~1.12MB (actual: ${glbStat.size} bytes)`);

const previewPath = path.resolve('public/characters/rahul_gandhi/three_quarter.png');
assert(fs.existsSync(previewPath), `Three-quarter preview render exists at ${previewPath}`);

const heroPath = path.resolve('public/characters/rahul_gandhi/hero.png');
assert(fs.existsSync(heroPath), `Hero preview render exists at ${heroPath}`);

const frontPath = path.resolve('public/characters/rahul_gandhi/front.png');
assert(fs.existsSync(frontPath), `Front preview render exists at ${frontPath}`);

const manifestPath = path.resolve('public/characters/rahul_gandhi/animation_manifest.json');
assert(fs.existsSync(manifestPath), `Animation manifest exists at ${manifestPath}`);

// ========================================================
// TEST 2: Character Catalog & Configuration
// ========================================================
console.log('\n--- Test 2: Character Catalog & Configuration ---');
const rahulByPrefix = getCharacterById('char_rahul_gandhi');
assert(rahulByPrefix !== undefined, "Character found via 'char_rahul_gandhi'");
const rahulDirect = getCharacterById('rahul_gandhi');
assert(rahulDirect !== undefined, "Character found via alias 'rahul_gandhi'");
assert(rahulByPrefix!.id === 'char_rahul_gandhi', "Catalog ID matches 'char_rahul_gandhi'");

assert(rahulByPrefix!.name === 'Rahul Gandhi', "Character name is exactly 'Rahul Gandhi'");
assert(rahulByPrefix!.rarity === 'LEGENDARY', 'Character rarity is LEGENDARY');
assert(rahulByPrefix!.unlock.type === 'COINS', 'Unlock currency is COINS');
assert(rahulByPrefix!.unlock.cost === 100000, 'Unlock price is exactly 100,000 Coins');
assert(rahulByPrefix!.isGlb === true, 'Character is configured with isGlb = true');
assert(rahulByPrefix!.glbPath === '/characters/rahul_gandhi/character.glb', 'Character glbPath is correct');
assert(rahulByPrefix!.defaultOutfitId === 'rahul_classic', 'Default outfit is rahul_classic');

const classicOutfit = getOutfitById('char_rahul_gandhi', 'rahul_classic');
assert(classicOutfit !== undefined, 'Outfit rahul_classic exists');
assert(classicOutfit!.features?.hasWhitePoloNavyPants === true, 'Classic outfit features white shirt & navy pants');
assert(classicOutfit!.features?.hasBeard === true, 'Classic outfit features beard');

// ========================================================
// TEST 3: Initial State & Free Trials System
// ========================================================
console.log('\n--- Test 3: Initial State & Free Trials System ---');
mockStorage.clear();
const upgradeMgr = UpgradeManager.getInstance();
upgradeMgr.load();
upgradeMgr.resetAll();

const prog = ProgressionManager.getInstance();
prog.resetAll();

assert(!prog.isCharacterUnlocked('char_rahul_gandhi'), 'Rahul Gandhi is locked by default');
assert(!prog.isCharacterUnlocked('rahul_gandhi'), 'Rahul Gandhi alias reports locked by default');
assert(prog.getRahulTrialsRemaining() === 5, 'Player starts with exactly 5 free trials for Rahul Gandhi');
assert(prog.getCharacterFreeRuns('char_rahul_gandhi') === 5, 'Generic getCharacterFreeRuns returns 5 trials');
assert(prog.getCharacterFreeRuns('rahul_gandhi') === 5, 'getCharacterFreeRuns with alias returns 5 trials');

// Shop preview / selection consumes zero trials
prog.equipCharacter('char_rahul_gandhi');
assert(prog.getSelectedCharacter() === 'char_rahul_gandhi', 'Rahul Gandhi is equipped on trial');
assert(prog.getRahulTrialsRemaining() === 5, 'Equipping/previewing consumes 0 trials (still 5/5)');
assert(!prog.isCharacterUnlocked('char_rahul_gandhi'), 'Rahul Gandhi remains locked from permanent ownership during trial');

// ========================================================
// TEST 4: Trial Run Consumption & Lifecycle
// ========================================================
console.log('\n--- Test 4: Trial Run Consumption & Lifecycle ---');
const bus = EventBus.getInstance();

// Run 1 begins: trial decrements 5 -> 4
bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
assert(prog.getRahulTrialsRemaining() === 4, 'First actual gameplay run decrements trials from 5 to 4');

// Pausing and resuming does NOT consume extra trials
bus.emit(EVENTS.GAME_PAUSE);
assert(prog.getRahulTrialsRemaining() === 4, 'Game pause consumes 0 additional trials');
bus.emit(EVENTS.GAME_RESUME);
assert(prog.getRahulTrialsRemaining() === 4, 'Game resume consumes 0 additional trials');

// Duplicate events during active run do NOT consume extra trials
bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
bus.emit(EVENTS.GAME_START);
assert(prog.getRahulTrialsRemaining() === 4, 'Duplicate RUN_STARTED/GAME_START events consume 0 extra trials (still 4)');

// Normal coins awarded during trial
bus.emit(EVENTS.COIN_COLLECTED);
bus.emit(EVENTS.COIN_COLLECTED);
assert(prog.getRunStats().coins === 2, 'Coins are awarded normally during free trial run');

// Run 1 finishes
bus.emit(EVENTS.GAME_OVER);
assert(prog.getRahulTrialsRemaining() === 4, 'Finishing run 1 preserves remaining trials at 4');
assert(prog.getSelectedCharacter() === 'char_rahul_gandhi', 'Rahul Gandhi remains equipped for next trial run');

// Run 2: 4 -> 3
bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
assert(prog.getRahulTrialsRemaining() === 3, 'Run 2 decrements trials from 4 to 3');
bus.emit(EVENTS.GAME_OVER);

// Run 3: 3 -> 2
bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
assert(prog.getRahulTrialsRemaining() === 2, 'Run 3 decrements trials from 3 to 2');
bus.emit(EVENTS.GAME_OVER);

// Run 4: 2 -> 1
bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
assert(prog.getRahulTrialsRemaining() === 1, 'Run 4 decrements trials from 2 to 1');
bus.emit(EVENTS.GAME_OVER);

// Run 5: 1 -> 0 (Last free trial)
bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
assert(prog.getRahulTrialsRemaining() === 0, 'Run 5 decrements trials from 1 to 0 (all 5 used)');
bus.emit(EVENTS.GAME_OVER);

// At end of 5th trial run, player reverts to owned character
assert(prog.getSelectedCharacter() === 'char_jax', 'After 5th trial, unowned Rahul Gandhi reverts to owned Jax');

// 6th unpaid run is blocked
const sixthEquip = prog.equipCharacter('char_rahul_gandhi');
assert(!sixthEquip.success, 'Equipping Rahul Gandhi blocked when 0 trials remain and unowned');
assert(prog.getSelectedCharacter() === 'char_jax', 'Selection remains Jax');

// Negative trial count is strictly prevented
prog.setRahulTrialsRemaining(-3);
assert(prog.getRahulTrialsRemaining() === 0, 'setRahulTrialsRemaining prevents negative trial count');

// ========================================================
// TEST 5: Persistence Across Reloads
// ========================================================
console.log('\n--- Test 5: Persistence Across Reloads ---');
prog.setRahulTrialsRemaining(2);
prog.saveState();

const rawSaved = mockStorage.getItem('metro_progression_v1');
assert(rawSaved !== null, 'Saved state exists in localStorage');
const parsedSaved = JSON.parse(rawSaved!);
assert(parsedSaved.rahulTrialsRemaining === 2, 'Saved state preserves 2 trials remaining');

// Re-instantiate ProgressionManager to simulate fresh app startup
prog.load();
assert(prog.getRahulTrialsRemaining() === 2, 'Reloading game recovers exact 2 trials remaining');

// Legacy save migration test (missing rahulTrialsRemaining starts at 5)
delete parsedSaved.rahulTrialsRemaining;
delete parsedSaved.rahulFreeRuns;
mockStorage.setItem('metro_progression_v1', JSON.stringify(parsedSaved));
prog.load();
assert(prog.getRahulTrialsRemaining() === 5, 'Legacy save safely backfills with exactly 5 free trials');

// ========================================================
// TEST 6: Permanent Purchase — 100,000 Coins
// ========================================================
console.log('\n--- Test 6: Permanent Purchase — 100,000 Coins ---');
// Insufficient balance: 0 coins
upgradeMgr.resetAll();
assert(upgradeMgr.getCoins() === 0, 'Player wallet is empty');
const resBuy0 = prog.purchaseCharacter('char_rahul_gandhi');
assert(!resBuy0.success, 'Purchase blocked at 0 coins');
assert(resBuy0.message.includes('Insufficient coins'), `Informative message: '${resBuy0.message}'`);
assert(!prog.isCharacterUnlocked('char_rahul_gandhi'), 'Remains locked after 0-coin attempt');

// Insufficient balance: 99,999 coins
upgradeMgr.addCoins(99999);
assert(upgradeMgr.getCoins() === 99999, 'Player has 99,999 coins');
const resBuy99k = prog.purchaseCharacter('char_rahul_gandhi');
assert(!resBuy99k.success, 'Purchase blocked at 99,999 coins (< 100,000 coins)');
assert(upgradeMgr.getCoins() === 99999, 'Coins untouched after rejected transaction');
assert(!prog.isCharacterUnlocked('char_rahul_gandhi'), 'Remains locked after 99,999-coin attempt');

// Exactly 100,000 coins: Successful purchase
upgradeMgr.addCoins(1);
assert(upgradeMgr.getCoins() === 100000, 'Player has exactly 100,000 coins');
const resBuySuccess = prog.purchaseCharacter('char_rahul_gandhi');
assert(resBuySuccess.success, 'Purchase succeeds with 100,000 coins');
assert(upgradeMgr.getCoins() === 0, 'Exact 100,000 coins deducted: 100,000 - 100,000 = 0');
assert(prog.isCharacterUnlocked('char_rahul_gandhi'), 'Rahul Gandhi is now permanently unlocked in inventory');
assert(prog.isCharacterUnlocked('rahul_gandhi'), 'Alias rahul_gandhi reports unlocked');

// Repeated purchase attempts never double-charge
upgradeMgr.addCoins(150000);
const resBuyDuplicate = prog.purchaseCharacter('char_rahul_gandhi');
assert(!resBuyDuplicate.success, 'Duplicate purchase blocked');
assert(resBuyDuplicate.message === 'Character already owned', 'Correct duplicate message returned');
assert(upgradeMgr.getCoins() === 150000, 'Duplicate purchase does not deduct coins (balance still 150,000)');

// Once purchased, gameplay runs never deduct trials
prog.setRahulTrialsRemaining(0);
bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
assert(prog.getRahulTrialsRemaining() === 0, 'Runs after permanent unlock never touch trial counters');
bus.emit(EVENTS.GAME_OVER);
assert(prog.getSelectedCharacter() === 'char_rahul_gandhi', 'Purchased Rahul Gandhi never reverts after game over');

// Permanent ownership persists across saves
prog.saveState();
const rawPostBuy = mockStorage.getItem('metro_progression_v1');
const parsedPostBuy = JSON.parse(rawPostBuy!);
assert(parsedPostBuy.unlockedCharacters.includes('char_rahul_gandhi'), 'Saved state contains char_rahul_gandhi');
prog.load();
assert(prog.isCharacterUnlocked('char_rahul_gandhi'), 'Reloading confirms permanent ownership');

// ========================================================
// TEST 7: 3D Model Generation & Animations
// ========================================================
console.log('\n--- Test 7: 3D Model Generation & Animations ---');
const builtRig = CharacterMeshBuilder.build('char_rahul_gandhi', 'rahul_classic');
assert(builtRig.rootGroup instanceof THREE.Group, 'Generated 3D root group');
assert(builtRig.hipsGroup instanceof THREE.Group, 'Generated hips group');
assert(builtRig.spineGroup instanceof THREE.Group, 'Generated spine group with white polo');
assert(builtRig.headGroup instanceof THREE.Group, 'Generated head group with swept hair & beard');
assert(builtRig.backpackGroup instanceof THREE.Group, 'Generated athletic sports pack');

const charModel = new CharacterModel('char_rahul_gandhi', 'rahul_classic');
assert(charModel.getCharacterId() === 'char_rahul_gandhi', 'CharacterModel reports char_rahul_gandhi');
assert(charModel.getOutfitId() === 'rahul_classic', 'CharacterModel reports rahul_classic');

// Test locomotion states
charModel.update(0.016, 'RUNNING', false, false, 0);
assert(charModel.mesh.visible, 'Character runs without error');

charModel.update(0.016, 'JUMPING', false, false, 0, 0.5);
assert(charModel.mesh.visible, 'Character jumps without error');

charModel.update(0.016, 'SLIDING', false, false, 0, 0, 0.5);
assert(charModel.mesh.visible, 'Character slides without error');

charModel.update(0.016, 'RUNNING', true, false, 0);
assert(charModel.mesh.visible, 'Character rides hoverboard without error');

charModel.update(0.016, 'JETPACK', false, false, 0);
assert(charModel.mesh.visible, 'Character flies jetpack without error');

charModel.animateTurntableIdle(0.016);
assert(charModel.mesh.visible, 'Showcase turntable idle animates without error');

// ========================================================
// TEST 8: Player Hitbox & Gameplay Physics
// ========================================================
console.log('\n--- Test 8: Player Hitbox & Gameplay Physics ---');
prog.equipCharacter('char_rahul_gandhi', 'rahul_classic');
const player = new Player();
assert(player.model.getCharacterId() === 'char_rahul_gandhi', 'Player equipped with Rahul Gandhi');

const collider = player.getCollider();
const playerWidth = collider.max.x - collider.min.x;
const playerDepth = collider.max.z - collider.min.z;
const playerHeight = collider.max.y - collider.min.y;

assert(Math.abs(playerWidth - CONSTANTS.PLAYER_WIDTH) < 0.001, `Collider width matches (${playerWidth} == ${CONSTANTS.PLAYER_WIDTH})`);
assert(Math.abs(playerDepth - CONSTANTS.PLAYER_DEPTH) < 0.001, `Collider depth matches (${playerDepth} == ${CONSTANTS.PLAYER_DEPTH})`);
assert(Math.abs(playerHeight - CONSTANTS.PLAYER_HEIGHT_RUN) < 0.001, `Collider run height matches (${playerHeight} == ${CONSTANTS.PLAYER_HEIGHT_RUN})`);
assert(collider.min.y === CONSTANTS.PLAYER_BASE_Y, `Ground baseline matches Y (${collider.min.y} == ${CONSTANTS.PLAYER_BASE_Y})`);

// Test jump & slide physics
player.state = 'RUN';
player.handleInput('UP');
assert(player.isJumping, 'Jump physics works with Rahul Gandhi');

player.reset();
player.state = 'RUN';
player.handleInput('DOWN');
assert(player.isSliding, 'Slide physics works with Rahul Gandhi');
const slideHeight = player.getCollider().max.y - player.getCollider().min.y;
assert(Math.abs(slideHeight - CONSTANTS.PLAYER_HEIGHT_SLIDE) < 0.001, `Slide clearance is 0.75m (${slideHeight} == ${CONSTANTS.PLAYER_HEIGHT_SLIDE})`);

// ========================================================
// TEST 9: Existing Characters Regression Guard
// ========================================================
console.log('\n--- Test 9: Existing Characters Regression Guard ---');
const allChars = getAllCharacters();
assert(allChars.some((c) => c.id === 'char_jax'), 'Jax is present');
assert(allChars.some((c) => c.id === 'char_luna'), 'Luna is present');
assert(allChars.some((c) => c.id === 'char_cruz'), 'Cruz is present');
assert(allChars.some((c) => c.id === 'char_nova'), 'Nova is present');
assert(allChars.some((c) => c.id === 'char_modi'), 'Narendra Modi is present');
assert(allChars.some((c) => c.id === 'char_rahul_gandhi'), 'Rahul Gandhi is present');
assert(allChars.length >= 6, `Catalog contains all 6 characters (found ${allChars.length})`);

// Modi free runs untouched
assert(prog.getModiFreeRuns() === 5, 'Modi free runs remain at 5 and unaffected');

console.log('\n================================================================');
console.log('🏆 ALL RAHUL GANDHI PREMIUM CHARACTER TESTS PASSED (100%)!');
console.log('================================================================\n');
