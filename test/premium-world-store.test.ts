import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventBus } from '../src/core/EventBus';
import {
  FREE_WORLD_IDS,
  getWorld,
  getWorlds,
  getDynamicEnvironmentIds,
  PREMIUM_WORLD_CONFIGS
} from '../src/environment/WorldCatalog';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { EnvironmentManager } from '../src/environment/EnvironmentConfig';
import { EnvironmentSelectModal } from '../src/ui/EnvironmentSelectModal';
import { ShopModal } from '../src/ui/ShopModal';

// Storage mock for test isolation
const PROGRESSION_KEY = 'metro_progression_v1';
const WALLET_KEY = 'metro_runner_wallet';
const storage = new Map<string, string>();

globalThis.localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, String(value)); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => { storage.clear(); },
  key: (index: number) => [...storage.keys()][index] ?? null,
  get length() { return storage.size; }
};

function createMockElement(tag: string = 'div') {
  const el: any = {
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    innerHTML: '',
    children: [] as any[],
    dataset: {} as Record<string, string>,
    disabled: false,
    checked: false,
    style: {},
    appendChild: (child: any) => {
      el.children.push(child);
      return child;
    },
    remove: () => {},
    addEventListener: () => {},
    querySelector: (selector: string) => {
      if (selector.startsWith('#')) {
        const targetId = selector.slice(1);
        if (el.innerHTML.includes(`id="${targetId}"`)) {
          return createMockElement('button');
        }
      }
      return null;
    },
    querySelectorAll: () => []
  };
  return el;
}

(globalThis as any).document = {
  createElement: (tag: string) => createMockElement(tag),
  getElementById: (id: string) => null
};

let checks = 0;
function check(condition: unknown, message: string) {
  assert.ok(condition, message);
  checks++;
}

console.log('--- Suite 1: World Catalog & Asset Completeness ---');

// 1. Verify all 10 worlds exist in the catalog
const progression = ProgressionManager.getInstance();
const wallet = UpgradeManager.getInstance();
const envManager = EnvironmentManager.getInstance();

const baselineProgression = JSON.parse(JSON.stringify(progression.getState()));

function resetState(coins = 50000) {
  storage.clear();
  storage.set(PROGRESSION_KEY, JSON.stringify(baselineProgression));
  progression.load();
  wallet.setCoins(coins);
}

resetState();

const allWorlds = getWorlds(progression.getState());
check(allWorlds.length === 17, `Expected 17 total worlds in catalog, got ${allWorlds.length}`);

const freeWorlds = allWorlds.filter((w) => w.unlock === 'FREE');
const premiumWorlds = allWorlds.filter((w) => w.unlock === 'COINS');
check(freeWorlds.length === 6, `Expected 6 free/bundled worlds, got ${freeWorlds.length}`);
check(premiumWorlds.length === 11, `Expected 11 premium worlds, got ${premiumWorlds.length}`);

// 2. Verify all 16 world preview screenshots exist on disk and have metadata
const publicDir = path.resolve(process.cwd(), 'public');
for (const world of allWorlds) {
  check(world.id && world.displayName, `World has valid id and displayName: ${world.id}`);
  check(world.subtitle && world.subtitle.length > 3, `World has informative subtitle: ${world.displayName}`);
  check(world.tagline && world.tagline.length > 5, `World has atmospheric tagline: ${world.displayName}`);
  check(world.description && world.description.length > 20, `World has rich description: ${world.displayName}`);
  check(world.features && world.features.length >= 3, `World has at least 3 featured landmarks: ${world.displayName}`);
  check(world.accentColor && world.accentColor.startsWith('#'), `World has valid hex accent color: ${world.accentColor}`);
  check(world.icon && world.icon.length > 0, `World has icon emoji: ${world.icon}`);
  check(world.previewImage && world.previewImage.startsWith('/worlds/'), `Preview image path starts with /worlds/: ${world.previewImage}`);

  // Check file exists on disk
  const diskPath = path.join(publicDir, world.previewImage);
  check(fs.existsSync(diskPath), `Preview screenshot exists on disk: ${diskPath}`);
  const stats = fs.statSync(diskPath);
  check(stats.size > 1000, `Preview screenshot is not an empty stub (${stats.size} bytes): ${world.previewImage}`);
}

// 3. Verify exact premium pricing
const expectedPricing: Record<string, number> = {
  NEON_RAINLINE: 3000,
  ORBITAL_HALO: 4500,
  ABYSSAL_GLASSLINE: 6000,
  DOOMSDAY_LAST_TRANSIT: 7500,
  PHANTOM_LINE: 9000,
  HAUNTED_CARNIVAL: 10500,
  MIDNIGHT_VELVET: 15000,
  CHRONO_KINGDOM: 18000,
  INFERNO_EXPRESS: 18000,
  JURASSIC_RUSH: 18000,
  VIVA_HEAT: 12000,
};

for (const [id, price] of Object.entries(expectedPricing)) {
  const w = getWorld(id);
  check(w !== undefined, `Premium world ${id} exists in catalog`);
  check(w?.coinCost === price, `World ${id} price is ${price} coins (got ${w?.coinCost})`);
  check(w?.available === true, `World ${id} is marked available`);
  check(w?.implemented === true, `World ${id} is marked implemented`);
}

console.log('--- Suite 2: Economy Invariants & World Purchasing ---');

// 4. Initial state: only free worlds unlocked
resetState(0);
for (const id of FREE_WORLD_IDS) {
  check(progression.isThemeUnlocked(id), `Free world ${id} is unlocked by default`);
}
for (const id of Object.keys(expectedPricing)) {
  check(!progression.isThemeUnlocked(id), `Premium world ${id} is locked initially`);
}

// 5. Revive Keys must NEVER be touched when purchasing worlds
const initialKeys = progression.getKeys();
check(initialKeys > 0, 'Player has revive keys');

// 6. Insufficient funds rejection
const cantAfford = progression.purchaseTheme('NEON_RAINLINE');
check(!cantAfford.success, 'Purchase fails when balance is 0');
check(!progression.isThemeUnlocked('NEON_RAINLINE'), 'World remains locked after rejected purchase');
check(wallet.getCoins() === 0, 'Wallet remains 0');
check(progression.getKeys() === initialKeys, 'Revive keys untouched after rejected purchase');

// 7. Successful purchase debits exact coins and permanently unlocks
wallet.setCoins(5000);
const buyNeon = progression.purchaseTheme('NEON_RAINLINE');
check(buyNeon.success, `Purchase of NEON_RAINLINE succeeded: ${buyNeon.message}`);
check(wallet.getCoins() === 2000, `Coins deducted correctly (5000 - 3000 = 2000, got ${wallet.getCoins()})`);
check(progression.isThemeUnlocked('NEON_RAINLINE'), 'NEON_RAINLINE is now unlocked');
check(progression.getKeys() === initialKeys, 'Revive keys untouched after successful purchase');

// 8. Purchase idempotency (cannot purchase already-owned world)
const buyAgain = progression.purchaseTheme('NEON_RAINLINE');
check(!buyAgain.success, 'Repurchasing owned world is rejected');
check(wallet.getCoins() === 2000, 'Coins NOT debited again on duplicate purchase');

// 9. Equipping owned world is 100% free
const equipResult = progression.equipTheme('NEON_RAINLINE');
check(equipResult.success, `Equipping NEON_RAINLINE succeeded: ${equipResult.message}`);
check(progression.getSelectedTheme() === 'NEON_RAINLINE', 'Equipped theme updated in progression');
check(wallet.getCoins() === 2000, 'Equipping owned world debited 0 coins');

// 10. Cannot equip locked world
const equipLocked = progression.equipTheme('ORBITAL_HALO');
check(!equipLocked.success, 'Cannot equip locked world');
check(progression.getSelectedTheme() === 'NEON_RAINLINE', 'Selected theme unchanged after rejected equip');

// 11. State persistence across reload
progression.saveState();
progression.load();
check(progression.isThemeUnlocked('NEON_RAINLINE'), 'NEON_RAINLINE ownership persisted across reload');
check(progression.getSelectedTheme() === 'NEON_RAINLINE', 'Equipped selection persisted across reload');

console.log('--- Suite 3: Dynamic Districts Filtering Invariants ---');

// 12. Dynamic districts defaults to excluding premium worlds
resetState();
check(!progression.getState().includePremiumThemesInDynamic, 'Dynamic districts opt-in defaults to false');
let dynamicPool = getDynamicEnvironmentIds(progression.getState());
check(dynamicPool.length === 4, `When opt-in is false, dynamic pool contains exactly 4 free worlds (got ${dynamicPool.length})`);
for (const id of FREE_WORLD_IDS) {
  check(dynamicPool.includes(id as any), `Free world ${id} is in dynamic pool`);
}
for (const id of Object.keys(expectedPricing)) {
  check(!dynamicPool.includes(id as any), `Premium world ${id} is NOT in dynamic pool when opt-in is false`);
}

// 13. Enable opt-in with no premium worlds unlocked
progression.setIncludePremiumThemesInDynamic(true);
check(progression.getState().includePremiumThemesInDynamic === true, 'Opt-in set to true');
dynamicPool = getDynamicEnvironmentIds(progression.getState());
check(dynamicPool.length === 4, 'Locked premium worlds are NEVER included even when opt-in is true');

// 14. Purchase 2 premium worlds and verify they join dynamic pool
wallet.setCoins(20000);
progression.purchaseTheme('NEON_RAINLINE');
progression.purchaseTheme('ORBITAL_HALO');
dynamicPool = getDynamicEnvironmentIds(progression.getState());
check(dynamicPool.length === 6, `Dynamic pool now has 6 worlds (4 free + 2 owned, got ${dynamicPool.length})`);
check(dynamicPool.includes('NEON_RAINLINE'), 'Owned NEON_RAINLINE is in dynamic pool');
check(dynamicPool.includes('ORBITAL_HALO'), 'Owned ORBITAL_HALO is in dynamic pool');
check(!dynamicPool.includes('ABYSSAL_GLASSLINE'), 'Locked ABYSSAL_GLASSLINE remains strictly excluded');
check(!dynamicPool.includes('DOOMSDAY_LAST_TRANSIT'), 'Locked DOOMSDAY_LAST_TRANSIT remains strictly excluded');

// 15. Disable opt-in again: dynamic pool reverts to only 4 free worlds
progression.setIncludePremiumThemesInDynamic(false);
dynamicPool = getDynamicEnvironmentIds(progression.getState());
check(dynamicPool.length === 4, 'Reverting opt-in immediately restricts dynamic pool back to 4 free worlds');

console.log('--- Suite 4: ShopModal Worlds Category UI Rendering ---');

// 16. Test minimal DOM creation for ShopModal.renderWorlds
resetState(5000);
progression.purchaseTheme('NEON_RAINLINE');
progression.equipTheme('NEON_RAINLINE');

const mockContainer = {
  innerHTML: '',
  querySelectorAll: function (selector: string) {
    if (selector.includes('data-preview-world')) {
      return [...this.innerHTML.matchAll(/data-preview-world="([^"]+)"/g)].map((m) => ({
        dataset: { previewWorld: m[1] },
        addEventListener: () => {}
      }));
    }
    if (selector.includes('data-buy-world')) {
      return [...this.innerHTML.matchAll(/data-buy-world="([^"]+)"/g)].map((m) => ({
        dataset: { buyWorld: m[1] },
        disabled: false,
        addEventListener: () => {}
      }));
    }
    if (selector.includes('data-equip-world')) {
      return [...this.innerHTML.matchAll(/data-equip-world="([^"]+)"/g)].map((m) => ({
        dataset: { equipWorld: m[1] },
        disabled: false,
        addEventListener: () => {}
      }));
    }
    return [];
  },
  querySelector: function (selector: string) {
    if (selector.includes('data-premium-dynamic')) {
      return {
        checked: false,
        addEventListener: () => {}
      };
    }
    return null;
  }
};

const shop = Object.assign(Object.create(ShopModal.prototype), {
  progression,
  upgradeManager: wallet,
  element: { appendChild: () => {}, querySelector: () => null }
});

shop.renderWorlds(mockContainer as any);

// Check rendered components
check(mockContainer.innerHTML.includes('DISTRICT ATLAS'), 'Shop renders District Atlas banner');
check(mockContainer.innerHTML.includes('worlds-shop-grid'), 'Shop renders worlds shop grid');
check(mockContainer.innerHTML.includes('premium-dynamic-toggle'), 'Shop renders dynamic districts toggle');

// Check preview images are present in rendered HTML
for (const world of allWorlds) {
  check(mockContainer.innerHTML.includes(`src="${world.previewImage}"`), `Card renders preview image for ${world.displayName}`);
  check(mockContainer.innerHTML.includes(world.displayName), `Card renders display name for ${world.displayName}`);
  check(mockContainer.innerHTML.includes(world.rarity), `Card renders rarity for ${world.displayName}`);
}

// Check button states
check(mockContainer.innerHTML.includes('btn-equipped'), 'Equipped NEON_RAINLINE renders EQUIPPED button');
check(mockContainer.innerHTML.includes('data-equip-world="MODERN_METRO"'), 'Owned but unequipped Modern Metro renders EQUIP button');
check(mockContainer.innerHTML.includes('data-buy-world="ORBITAL_HALO"'), 'Affordable locked Orbital Halo renders buy button');

console.log('--- Suite 5: Purchase Confirmation & Showcase Preview Modals ---');

// 17. Test Purchase Confirmation Dialog Modal Creation
let appendedOverlay: any = null;
shop.element = {
  appendChild: (child: any) => { appendedOverlay = child; },
  querySelector: () => null
};

shop.openBuyConfirmation('ORBITAL_HALO');
check(appendedOverlay !== null, 'Buy confirmation overlay was appended');
check(appendedOverlay.id === 'world-confirm-overlay', 'Overlay has id world-confirm-overlay');
check(appendedOverlay.innerHTML.includes('Unlock Orbital Halo'), 'Confirmation dialog displays target world name');
check(appendedOverlay.innerHTML.includes('4,500 🪙'), 'Confirmation dialog displays price 4,500');
check(appendedOverlay.innerHTML.includes('Permanent World Ownership'), 'Confirmation dialog displays permanent ownership guarantee');
check(appendedOverlay.innerHTML.includes('data-confirm-buy="ORBITAL_HALO"'), 'Confirmation dialog has confirm buy button');

// 18. Test Showcase Preview Modal Creation
let showcaseOverlay: any = null;
shop.element = {
  appendChild: (child: any) => { showcaseOverlay = child; },
  querySelector: () => null
};

shop.openWorldPreview('ABYSSAL_GLASSLINE');
check(showcaseOverlay !== null, 'Showcase preview overlay was appended');
check(showcaseOverlay.id === 'world-showcase-overlay', 'Showcase has id world-showcase-overlay');
check(showcaseOverlay.innerHTML.includes('Abyssal Glassline'), 'Showcase displays Abyssal Glassline title');
check(showcaseOverlay.innerHTML.includes('DISTRICT FEATURES &amp; LANDMARKS') || showcaseOverlay.innerHTML.includes('DISTRICT FEATURES & LANDMARKS'),
  'Showcase displays features section');
check(showcaseOverlay.innerHTML.includes('RUNNER SPECIFICATIONS'), 'Showcase displays runner specifications');
check(showcaseOverlay.innerHTML.includes('src="/worlds/abyssal_glassline.png"'), 'Showcase displays large hero image');

console.log('--- Suite 6: EnvironmentSelectModal Discovery & Transitions ---');

// 19. EnvironmentSelectModal renders thumbnails and discovery section
resetState(0);
const selectList = {
  innerHTML: '',
  appendChild: () => {},
  querySelectorAll: function (selector?: string) {
    return [...this.innerHTML.matchAll(/data-env-id="([^"]+)"/g)].map((match) => ({
      getAttribute: () => match[1],
      addEventListener: () => {}
    }));
  }
};

(globalThis as any).document.getElementById = (id: string) => {
  if (id === 'env-options-list') return selectList;
  return null;
};
const selectModal = Object.assign(Object.create(EnvironmentSelectModal.prototype), {
  envManager,
  selectedPreference: 'DYNAMIC',
  hide: () => {}
});

selectModal.render();

// Free worlds are in selectable list
for (const id of FREE_WORLD_IDS) {
  check(selectList.innerHTML.includes(`data-env-id="${id}"`), `Free world ${id} is selectable`);
}

// Locked worlds are NOT selectable via data-env-id
for (const id of Object.keys(expectedPricing)) {
  check(!selectList.innerHTML.includes(`data-env-id="${id}"`), `Locked world ${id} is not selectable`);
}

// Locked worlds ARE present in the discovery section
check(selectList.innerHTML.includes('EXPLORE PREMIUM WORLDS IN SHOP'), 'Modal renders discovery section header');
for (const id of Object.keys(expectedPricing)) {
  check(selectList.innerHTML.includes(`data-shop-world="${id}"`), `Locked world ${id} is featured in discovery with shop button`);
  const w = getWorld(id);
  check(selectList.innerHTML.includes(w!.displayName), `Discovery features ${w!.displayName}`);
}

// When purchased, world migrates from discovery into selectable options
wallet.setCoins(20000);
progression.purchaseTheme('HAUNTED_CARNIVAL');
selectModal.render();

check(selectList.innerHTML.includes('data-env-id="HAUNTED_CARNIVAL"'), 'Purchased Haunted Carnival now has data-env-id');
check(!selectList.innerHTML.includes('data-shop-world="HAUNTED_CARNIVAL"'), 'Purchased Haunted Carnival removed from discovery section');

console.log(`\n==============================================`);
console.log(`SUCCESS: All ${checks} Premium World Store checks passed!`);
console.log(`==============================================\n`);
