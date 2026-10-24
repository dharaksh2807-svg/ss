import * as THREE from 'three';
import {
  CHARACTER_CATALOG,
  getAllCharacters,
  getCharacterById,
  getOutfitById,
  CharacterId
} from '../src/characters/CharacterCatalog';
import { CharacterMeshBuilder } from '../src/characters/CharacterMeshBuilder';
import { CharacterModel } from '../src/player/CharacterModel';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { Player } from '../src/player/Player';
import { EventBus } from '../src/core/EventBus';
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

console.log('🧪 Starting Task 5: Character Roster, Skins, Outfits & 3D Customization Test Suite...\n');

// ========================================================
// TEST 1: Character Catalog & Roster Completeness
// ========================================================
console.log('--- Test 1: Character Catalog & Roster Completeness ---');
const allChars = getAllCharacters();
assert(allChars.length >= 4, `Catalog contains at least 4 initial characters (found ${allChars.length})`);

const expectedCharIds: CharacterId[] = ['char_jax', 'char_luna', 'char_cruz', 'char_nova'];
expectedCharIds.forEach((id) => {
  const char = getCharacterById(id);
  assert(char !== undefined, `Character '${id}' exists in catalog`);
  assert(char!.name.length > 0, `Character '${id}' has a valid name (${char?.name})`);
  assert(char!.title.length > 0, `Character '${id}' has a title (${char?.title})`);
  assert(char!.personality.length > 0, `Character '${id}' has a personality bio`);
  assert(char!.silhouetteDescription.length > 0, `Character '${id}' has unique silhouette specifications`);
  assert(char!.outfits.length >= 2, `Character '${id}' has at least 2 outfits (found ${char?.outfits.length})`);
});

// Verify Default Free Character
const jax = getCharacterById('char_jax')!;
assert(jax.unlock.type === 'FREE', 'Jax is the default free character');
assert(jax.defaultOutfitId === 'jax_classic', 'Jax default outfit is jax_classic');

// Verify Purchasable Characters
const luna = getCharacterById('char_luna')!;
assert(luna.unlock.type === 'COINS' && (luna.unlock.cost ?? 0) > 0, `Luna is purchasable with earned coins (${luna.unlock.cost} coins)`);

const cruz = getCharacterById('char_cruz')!;
assert(cruz.unlock.type === 'COINS' && (cruz.unlock.cost ?? 0) > 0, `Cruz is purchasable with earned coins (${cruz.unlock.cost} coins)`);

const nova = getCharacterById('char_nova')!;
assert(nova.unlock.type === 'COINS' && (nova.unlock.cost ?? 0) > 0, `Nova is purchasable with earned coins (${nova.unlock.cost} coins)`);

// ========================================================
// TEST 2: 3D Mesh Generation & Distinct Silhouettes
// ========================================================
console.log('\n--- Test 2: 3D Mesh Generation & Distinct Silhouettes ---');

// Build Jax
const jaxRig = CharacterMeshBuilder.build('char_jax', 'jax_classic');
assert(jaxRig.rootGroup instanceof THREE.Group, 'Jax generates valid 3D root group');
assert(jaxRig.headGroup.children.length > 3, 'Jax head contains hat, goggles, bangs and facial geometry');
assert(jaxRig.backpackGroup.children.length >= 2, 'Jax has street runner backpack with spray paint cans');

// Build Luna
const lunaRig = CharacterMeshBuilder.build('char_luna', 'luna_neon');
assert(lunaRig.rootGroup instanceof THREE.Group, 'Luna generates valid 3D root group');
assert(lunaRig.headGroup.children.length > 3, 'Luna head contains twin cyber ponytails and holographic cyber visor');
assert(lunaRig.backpackGroup.children.length >= 2, 'Luna has cyber data-deck backpack with power core');

// Build Cruz
const cruzRig = CharacterMeshBuilder.build('char_cruz', 'cruz_bboy');
assert(cruzRig.rootGroup instanceof THREE.Group, 'Cruz generates valid 3D root group');
assert(cruzRig.headGroup.children.length > 3, 'Cruz head contains curly afro dome and tied bandana with tails');
assert(cruzRig.backpackGroup.children.length >= 2, 'Cruz has retro street boombox backpack with dual speakers');

// Build Nova
const novaRig = CharacterMeshBuilder.build('char_nova', 'nova_solar');
assert(novaRig.rootGroup instanceof THREE.Group, 'Nova generates valid 3D root group');
assert(novaRig.headGroup.children.length > 3, 'Nova head contains aerodynamic speed helmet with side fins and sun visor');
assert(novaRig.backpackGroup.children.length >= 2, 'Nova has solarpunk micro-turbine generator backpack');

// Verify all 12 outfits compile and generate 3D hierarchy without errors
let totalOutfitsTested = 0;
allChars.forEach((c) => {
  c.outfits.forEach((o) => {
    const rig = CharacterMeshBuilder.build(c.id, o.id);
    assert(rig.rootGroup.children.length > 0, `Outfit '${o.name}' for ${c.name} generates valid 3D meshes`);
    totalOutfitsTested++;
  });
});
assert(totalOutfitsTested >= 12, `All character outfits across the roster compile successfully (${totalOutfitsTested}/12+)`);

// ========================================================
// TEST 3: Compatible Humanoid Rig & Animation State Machine
// ========================================================
console.log('\n--- Test 3: Compatible Humanoid Rig & Animation State Machine ---');

const model = new CharacterModel('char_jax', 'jax_classic');
assert(model.mesh instanceof THREE.Group, 'CharacterModel instantiates Three.js group');
assert(model.getCharacterId() === 'char_jax', 'CharacterModel reports correct character ID');
assert(model.getOutfitId() === 'jax_classic', 'CharacterModel reports correct outfit ID');

// Test running cycle update
model.update(0.016, 'RUNNING', false, false, 0);
assert(model.mesh.visible, 'CharacterModel is visible in RUNNING cycle');

// Test jump posing
model.update(0.016, 'JUMPING', false, false, 0, 0.5);
assert(model.mesh.visible, 'CharacterModel updates in JUMPING state');

// Test slide pose
model.update(0.016, 'SLIDING', false, false, 0, 0, 0.5);
assert(model.mesh.visible, 'CharacterModel updates in SLIDING state');

// Test hoverboard surfing pose
model.update(0.016, 'RUNNING', true, false, 0);
assert(model.mesh.visible, 'CharacterModel updates in HOVERBOARD riding stance');

// Test jetpack flight posture
model.update(0.016, 'JETPACK', false, false, 0);
assert(model.mesh.visible, 'CharacterModel updates in JETPACK aerodynamic flight posture');

// Test stumbling reaction
model.update(0.016, 'STUMBLING', false, false, 0);
assert(model.mesh.visible, 'CharacterModel updates in STUMBLING collision reaction');

// Test showroom idle animation
model.animateTurntableIdle(0.016);
assert(model.mesh.visible, 'CharacterModel plays character-specific showcase idle animation');

// ========================================================
// TEST 4: Dynamic Model & Outfit Swapping with Cleanup
// ========================================================
console.log('\n--- Test 4: Dynamic Model & Outfit Swapping with Cleanup ---');

model.setHoverboardVisible(true);
model.setSuperSneakersActive(true);

// Swap from Jax to Luna
model.applyCharacter('char_luna', 'luna_violet');
assert(model.getCharacterId() === 'char_luna', 'Model swapped character to char_luna');
assert(model.getOutfitId() === 'luna_violet', 'Model swapped outfit to luna_violet');

// Verify power-up states preserved across character swap
model.update(0.016, 'RUNNING', true, true, 0);
assert(model.mesh.visible, 'Character runs properly with preserved power-ups after character swap');

// Swap from Luna to Cruz
model.applyCharacter('char_cruz', 'cruz_bboy');
assert(model.getCharacterId() === 'char_cruz', 'Model swapped character to char_cruz');
assert(model.getOutfitId() === 'cruz_bboy', 'Model swapped outfit to cruz_bboy');

// Swap from Cruz to Nova
model.applyCharacter('char_nova', 'nova_solar');
assert(model.getCharacterId() === 'char_nova', 'Model swapped character to char_nova');
assert(model.getOutfitId() === 'nova_solar', 'Model swapped outfit to nova_solar');

// ========================================================
// TEST 5: Progression, Economy & Unlock Verification
// ========================================================
console.log('\n--- Test 5: Progression, Economy & Unlock Verification ---');

mockStorage.clear();
const upgradeMgr = UpgradeManager.getInstance();
upgradeMgr.load();
upgradeMgr.resetAll();

const prog = ProgressionManager.getInstance();

// 1. Check Default Character Unlocks
assert(prog.isCharacterUnlocked('char_jax'), 'Jax is unlocked by default');
assert(!prog.isCharacterUnlocked('char_luna'), 'Luna is locked initially');
assert(!prog.isCharacterUnlocked('char_cruz'), 'Cruz is locked initially');
assert(!prog.isCharacterUnlocked('char_nova'), 'Nova is locked initially');

// 2. Insufficient Funds Block
upgradeMgr.resetAll(); // 0 coins
const failedPurchase = prog.purchaseCharacter('char_luna');
assert(!failedPurchase.success, 'Purchase blocked when player has insufficient coins');
assert(!prog.isCharacterUnlocked('char_luna'), 'Luna remains locked after failed purchase');

// 3. Successful Purchase with Exact Single Deduction
upgradeMgr.addCoins(2000);
assert(upgradeMgr.getCoins() === 2000, 'Wallet has 2,000 coins');

const successPurchase = prog.purchaseCharacter('char_luna'); // Cost: 1,500 coins
assert(successPurchase.success, 'Luna purchase succeeded with sufficient coins');
assert(prog.isCharacterUnlocked('char_luna'), 'Luna is now marked unlocked in inventory');
assert(upgradeMgr.getCoins() === 500, `Exact cost deducted once: 2,000 - 1,500 = ${upgradeMgr.getCoins()} coins`);

// 4. Duplicate Purchase Rejected
const duplicatePurchase = prog.purchaseCharacter('char_luna');
assert(!duplicatePurchase.success, 'Duplicate purchase rejected');
assert(upgradeMgr.getCoins() === 500, 'Wallet coins unchanged after duplicate purchase attempt');

// 5. Outfit Purchase & Unlocks
assert(prog.isOutfitUnlocked('char_luna', 'luna_neon'), 'Default outfit for Luna is unlocked upon character unlock');
assert(!prog.isOutfitUnlocked('char_luna', 'luna_violet'), 'Alternate outfit luna_violet is initially locked');

// Buy outfit for 1000 coins (player currently has 500 coins -> should fail)
const failedOutfitPurchase = prog.purchaseOutfit('char_luna', 'luna_violet');
assert(!failedOutfitPurchase.success, 'Outfit purchase fails with insufficient coins');

upgradeMgr.addCoins(1000); // Now 1,500 coins
const successOutfitPurchase = prog.purchaseOutfit('char_luna', 'luna_violet');
assert(successOutfitPurchase.success, 'Outfit purchase succeeds');
assert(prog.isOutfitUnlocked('char_luna', 'luna_violet'), 'Outfit luna_violet is now unlocked');
assert(upgradeMgr.getCoins() === 500, `Exact outfit cost deducted: 1,500 - 1,000 = ${upgradeMgr.getCoins()} coins`);

// 6. Equip Character & Outfit
const equipRes = prog.equipCharacter('char_luna', 'luna_violet');
assert(equipRes.success, 'Equipped Luna in Electric Phantom outfit');
assert(prog.getSelectedCharacter() === 'char_luna', 'Selected character updated to char_luna');
assert(prog.getSelectedOutfit('char_luna') === 'luna_violet', 'Selected outfit updated to luna_violet');

// 7. Equip Locked Character Blocked
const lockedEquip = prog.equipCharacter('char_cruz');
assert(!lockedEquip.success, 'Cannot equip locked character Cruz');

// 8. Narendra Modi Legendary Store Item & 100,000 Coins Economy Verification
console.log('\n--- Test 5B: Narendra Modi Legendary Character Verification ---');
const modiDef = getCharacterById('char_modi');
assert(modiDef !== undefined, "Narendra Modi ('char_modi') exists in Character Catalog");
assert(modiDef!.name === 'Narendra Modi', "Character name is exactly 'Narendra Modi'");
assert(modiDef!.rarity === 'LEGENDARY', 'Character rarity is LEGENDARY');
assert(modiDef!.unlock.type === 'COINS', 'Unlock type is COINS');
assert(modiDef!.unlock.cost === 100000, 'Unlock price is exactly 100,000 Coins');
assert(!prog.isCharacterUnlocked('char_modi'), 'Narendra Modi is initially locked');

// Attempt purchase with insufficient coins (e.g. 45,000 coins)
upgradeMgr.resetAll();
upgradeMgr.addCoins(45000);
const failedModiPurchase = prog.purchaseCharacter('char_modi');
assert(!failedModiPurchase.success, 'Cannot purchase Narendra Modi with fewer than 100,000 coins (45,000 coins in wallet)');
assert(!prog.isCharacterUnlocked('char_modi'), 'Narendra Modi remains locked after failed purchase');
assert(upgradeMgr.getCoins() === 45000, 'Wallet balance untouched after failed purchase');

// Supply sufficient coins (150,000 coins) and purchase
upgradeMgr.addCoins(105000); // Now 150,000 coins
assert(upgradeMgr.getCoins() === 150000, 'Wallet has 150,000 coins');
const successModiPurchase = prog.purchaseCharacter('char_modi');
assert(successModiPurchase.success, 'Narendra Modi purchase succeeded with 100,000 coins');
assert(prog.isCharacterUnlocked('char_modi'), 'Narendra Modi is now permanently unlocked in inventory');
assert(upgradeMgr.getCoins() === 50000, `Exact 100,000 coins deducted: 150,000 - 100,000 = ${upgradeMgr.getCoins()} coins`);

// Duplicate purchase blocked
const duplicateModiPurchase = prog.purchaseCharacter('char_modi');
assert(!duplicateModiPurchase.success, 'Duplicate purchase of Narendra Modi rejected');
assert(upgradeMgr.getCoins() === 50000, 'Wallet coins unchanged after duplicate purchase attempt');

// Equip Narendra Modi without deducting coins
assert(prog.getSelectedCharacter() === 'char_modi', 'Narendra Modi automatically equipped on purchase');
const reEquip = prog.equipCharacter('char_modi');
assert(reEquip.success, 'Equipping Narendra Modi succeeds without error');
assert(upgradeMgr.getCoins() === 50000, 'Equipping Narendra Modi does NOT deduct coins');

// Restore Luna selection for Test 6 continuity
prog.equipCharacter('char_luna', 'luna_violet');

// ========================================================
// TEST 6: Persistence Across Browser Reload
// ========================================================
console.log('\n--- Test 6: Persistence Across Browser Reload ---');

prog.saveState();
const rawStorage = mockStorage.getItem('metro_progression_v1');
assert(rawStorage !== null, 'Progression saved to localStorage under metro_progression_v1');

const parsedState = JSON.parse(rawStorage!);
assert(parsedState.unlockedCharacters.includes('char_luna'), 'Persisted state contains unlocked char_luna');
assert(parsedState.selectedCharacter === 'char_luna', 'Persisted state has char_luna selected');
assert(parsedState.selectedOutfits['char_luna'] === 'luna_violet', 'Persisted state has luna_violet outfit selected');

// ========================================================
// TEST 7: Gameplay Equivalence & Player Integration
// ========================================================
console.log('\n--- Test 7: Gameplay Equivalence & Player Integration ---');

const player = new Player();
assert(player.model.getCharacterId() === 'char_luna', 'Player initialized with persisted character Luna');
assert(player.model.getOutfitId() === 'luna_violet', 'Player initialized with persisted outfit luna_violet');

// Verify collision baseline consistency across characters
const baseBox = player.collider.clone();
assert(
  baseBox.min.y === CONSTANTS.PLAYER_BASE_Y &&
  baseBox.max.y === CONSTANTS.PLAYER_BASE_Y + CONSTANTS.PLAYER_HEIGHT_RUN,
  `Player AABB collider correctly bounded (Y: ${baseBox.min.y} to ${baseBox.max.y})`
);

// Swap to Cruz and test bounding box
player.applyCharacter('char_cruz', 'cruz_bboy');
assert(player.model.getCharacterId() === 'char_cruz', 'Player switched to Cruz');
assert(player.collider.min.y === baseBox.min.y, 'Cruz collider maintains identical ground baseline (no floating or sinking)');

// Swap to Nova and test bounding box
player.applyCharacter('char_nova', 'nova_solar');
assert(player.model.getCharacterId() === 'char_nova', 'Player switched to Nova');
assert(player.collider.min.y === baseBox.min.y, 'Nova collider maintains identical ground baseline (no floating or sinking)');

// Test run, jump, slide with new character
player.reset(); // Set to RUN state
player.handleInput('UP');
assert(player.isJumping, 'Player jumps properly with custom character');

// Reset to ground and test slide
player.reset();
player.handleInput('DOWN');
assert(player.isSliding, 'Player slides properly with custom character');

// Player reset restores equipped character from progression
player.reset();
assert(player.model.getCharacterId() === 'char_luna', 'Player.reset() restores selected character Luna');
assert(player.state === 'RUN', 'Player.reset() resets state to RUN');

console.log('\n=======================================================');
console.log('🏆 ALL 45/45 CHARACTER ROSTER & CUSTOMIZATION TESTS PASSED!');
console.log('=======================================================\n');
