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

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting Narendra Modi Legendary Character Integration & Economy Test Suite...\n');

// ========================================================
// TEST 1: Physical Asset Integrity
// ========================================================
console.log('--- Test 1: Physical Asset Integrity ---');
const glbPath = path.resolve('public/characters/modi/character.glb');
assert(fs.existsSync(glbPath), `GLB model exists at ${glbPath}`);
const glbStat = fs.statSync(glbPath);
assert(glbStat.size > 1_000_000, `GLB size is ~1.1MB (actual: ${glbStat.size} bytes)`);

const previewPath = path.resolve('public/characters/modi/three_quarter.png');
assert(fs.existsSync(previewPath), `Three-quarter preview render exists at ${previewPath}`);

const heroPath = path.resolve('public/characters/modi/hero.png');
assert(fs.existsSync(heroPath), `Hero preview render exists at ${heroPath}`);

const frontPath = path.resolve('public/characters/modi/front.png');
assert(fs.existsSync(frontPath), `Front preview render exists at ${frontPath}`);

// ========================================================
// TEST 2: Character Catalog & Legendary Configuration
// ========================================================
console.log('\n--- Test 2: Character Catalog & Legendary Configuration ---');
const modi = getCharacterById('char_modi');
assert(modi !== undefined, "Character 'char_modi' is registered in CHARACTER_CATALOG");
assert(modi!.name === 'Narendra Modi', "Character name is exactly 'Narendra Modi'");
assert(modi!.title === 'The Statesman Runner', `Character title is '${modi!.title}'`);
assert(modi!.rarity === 'LEGENDARY', 'Character rarity is LEGENDARY');
assert(modi!.unlock.type === 'COINS', 'Unlock currency is COINS');
assert(modi!.unlock.cost === 100000, 'Unlock price is exactly 100,000 Coins');
assert(modi!.isGlb === true, 'Character is configured with isGlb = true');
assert(modi!.glbPath === '/characters/modi/character.glb', 'Character glbPath is correct');
assert(modi!.outfits.length >= 2, `Character has at least 2 outfits (found ${modi!.outfits.length})`);
assert(modi!.defaultOutfitId === 'modi_classic', 'Default outfit is modi_classic');

const classicOutfit = getOutfitById('char_modi', 'modi_classic');
assert(classicOutfit !== undefined, 'Outfit modi_classic exists');
assert(classicOutfit!.features?.hasKurtaWaistcoat === true, 'Classic outfit features traditional Kurta & Waistcoat');
assert(classicOutfit!.features?.hasSpectacles === true, 'Classic outfit features spectacles');

// ========================================================
// TEST 3: Purchasing Behavior & 100,000 Coin Economy
// ========================================================
console.log('\n--- Test 3: Purchasing Behavior & 100,000 Coin Economy ---');
mockStorage.clear();
const upgradeMgr = UpgradeManager.getInstance();
upgradeMgr.load();
upgradeMgr.resetAll();

const prog = ProgressionManager.getInstance();
prog.resetAll();

// Check initially locked but 5 free runs granted
assert(!prog.isCharacterUnlocked('char_modi'), 'Narendra Modi is locked by default');
assert(prog.getModiFreeRuns() === 5, 'Player starts with exactly 5 free runs for Narendra Modi');

// Can equip on free trial without unlocking
const resFreeEquip = prog.equipCharacter('char_modi');
assert(resFreeEquip.success, 'Equipping Narendra Modi succeeds on free trial');
assert(!prog.isCharacterUnlocked('char_modi'), 'Narendra Modi remains locked from permanent ownership on free trial');

// Reset to Jax for purchase tests
prog.equipCharacter('char_jax');

// Blocked at 0 coins
const res0 = prog.purchaseCharacter('char_modi');
assert(!res0.success, 'Purchase blocked when player has 0 coins');
assert(!prog.isCharacterUnlocked('char_modi'), 'Remains locked after 0-coin attempt');

// Blocked at 99,999 coins (under 100,000 coins)
upgradeMgr.addCoins(99999);
assert(upgradeMgr.getCoins() === 99999, 'Player has 99,999 coins');
const res99k = prog.purchaseCharacter('char_modi');
assert(!res99k.success, 'Purchase blocked when player has 99,999 coins (< 100,000 coins)');
assert(upgradeMgr.getCoins() === 99999, 'Wallet balance untouched after insufficient purchase');
assert(!prog.isCharacterUnlocked('char_modi'), 'Remains locked after 99,999-coin attempt');

// Add 1 coin to reach exactly 100,000 coins
upgradeMgr.addCoins(1);
assert(upgradeMgr.getCoins() === 100000, 'Player has exactly 100,000 coins');

// Successful purchase
const resSuccess = prog.purchaseCharacter('char_modi');
assert(resSuccess.success, 'Purchase succeeds with exactly 100,000 coins');
assert(prog.isCharacterUnlocked('char_modi'), 'Narendra Modi is now unlocked in inventory');
assert(upgradeMgr.getCoins() === 0, 'Exact 100,000 coins deducted: 100,000 - 100,000 = 0 coins');

// Duplicate purchase blocked
const resDuplicate = prog.purchaseCharacter('char_modi');
assert(!resDuplicate.success, 'Duplicate purchase is strictly blocked');
assert(resDuplicate.message === 'Character already owned', `Proper message returned: '${resDuplicate.message}'`);

// Re-equipping does not deduct coins
upgradeMgr.addCoins(5000);
const resEquip = prog.equipCharacter('char_modi');
assert(resEquip.success, 'Equipping character succeeds');
assert(upgradeMgr.getCoins() === 5000, 'Equipping character does not deduct coins (balance still 5,000 coins)');

// ========================================================
// TEST 4: Persistence Across Sessions
// ========================================================
console.log('\n--- Test 4: Persistence Across Sessions ---');
prog.saveState();
const savedRaw = mockStorage.getItem('metro_progression_v1');
assert(savedRaw !== null, 'Saved state exists in localStorage');
const savedState = JSON.parse(savedRaw!);
assert(savedState.unlockedCharacters.includes('char_modi'), "Saved state contains 'char_modi' in unlockedCharacters");
assert(savedState.selectedCharacter === 'char_modi', "Saved state has 'char_modi' selected as active runner");

// ========================================================
// TEST 5: 3D Model Generation & Visual Hierarchy
// ========================================================
console.log('\n--- Test 5: 3D Model Generation & Visual Hierarchy ---');
const builtRig = CharacterMeshBuilder.build('char_modi', 'modi_classic');
assert(builtRig.rootGroup instanceof THREE.Group, 'Character generates valid 3D root group');
assert(builtRig.hipsGroup instanceof THREE.Group, 'Generates hips group');
assert(builtRig.spineGroup instanceof THREE.Group, 'Generates spine group');
assert(builtRig.headGroup instanceof THREE.Group, 'Generates head group with hair and spectacles');
assert(builtRig.backpackGroup instanceof THREE.Group, 'Generates statesman satchel gear');

const charModel = new CharacterModel('char_modi', 'modi_classic');
assert(charModel.getCharacterId() === 'char_modi', 'CharacterModel reports character ID char_modi');
assert(charModel.getOutfitId() === 'modi_classic', 'CharacterModel reports outfit ID modi_classic');

// Test locomotion transitions
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
// TEST 6: Gameplay Integration & Hitbox Consistency
// ========================================================
console.log('\n--- Test 6: Gameplay Integration & Hitbox Consistency ---');
const player = new Player();
assert(player.model.getCharacterId() === 'char_modi', 'Player automatically equipped with Narendra Modi from progression');

// Verify standard AABB collision dimensions
const collider = player.getCollider();
const playerWidth = collider.max.x - collider.min.x;
const playerDepth = collider.max.z - collider.min.z;
const playerHeight = collider.max.y - collider.min.y;

assert(Math.abs(playerWidth - CONSTANTS.PLAYER_WIDTH) < 0.001, `Collider width matches standard (${playerWidth} == ${CONSTANTS.PLAYER_WIDTH})`);
assert(Math.abs(playerDepth - CONSTANTS.PLAYER_DEPTH) < 0.001, `Collider depth matches standard (${playerDepth} == ${CONSTANTS.PLAYER_DEPTH})`);
assert(Math.abs(playerHeight - CONSTANTS.PLAYER_HEIGHT_RUN) < 0.001, `Collider run height matches standard (${playerHeight} == ${CONSTANTS.PLAYER_HEIGHT_RUN})`);
assert(collider.min.y === CONSTANTS.PLAYER_BASE_Y, `Ground baseline matches standard Y (${collider.min.y} == ${CONSTANTS.PLAYER_BASE_Y})`);

// Test jump physics
player.state = 'RUN';
player.handleInput('UP');
assert(player.isJumping, 'Player executes jump with Narendra Modi');

// Test slide physics
player.reset();
player.state = 'RUN';
player.handleInput('DOWN');
assert(player.isSliding, 'Player executes slide with Narendra Modi');
const slideHeight = player.getCollider().max.y - player.getCollider().min.y;
assert(Math.abs(slideHeight - CONSTANTS.PLAYER_HEIGHT_SLIDE) < 0.001, `Slide collider height matches 0.75m barrier clearance (${slideHeight} == ${CONSTANTS.PLAYER_HEIGHT_SLIDE})`);

console.log('\n================================================================');
console.log('🏆 ALL NARENDRA MODI LEGENDARY CHARACTER TESTS PASSED (100%)!');
console.log('================================================================\n');
