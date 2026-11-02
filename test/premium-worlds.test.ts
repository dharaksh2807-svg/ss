import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus';
import { EnvironmentManager, ENVIRONMENTS } from '../src/environment/EnvironmentConfig';
import type { EnvironmentId } from '../src/environment/EnvironmentConfig';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { DistrictPlanner } from '../src/environment/DistrictPlanner';
import { FREE_WORLD_IDS, getWorld, getWorlds, getDynamicEnvironmentIds } from '../src/environment/WorldCatalog';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { EnvironmentSelectModal } from '../src/ui/EnvironmentSelectModal';
import { ShopModal } from '../src/ui/ShopModal';

const PROGRESSION = 'metro_progression_v1';
const WALLET = 'metro_runner_wallet';
const LEGACY = 'metro_runner_environment_preference';
const data = new Map<string, string>();
let failWrite: (key: string) => boolean = () => false;
let failRead: (key: string) => boolean = () => false;
let walletWrites = 0;
globalThis.localStorage = {
  getItem: (key: string) => {
    if (failRead(key)) throw new Error('Storage unavailable');
    return data.get(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    if (failWrite(key)) throw new Error('Storage full');
    if (key === WALLET) walletWrites++;
    data.set(key, String(value));
  },
  removeItem: (key: string) => { data.delete(key); },
  clear: () => { data.clear(); },
  key: (index: number) => [...data.keys()][index] ?? null,
  get length() { return data.size; }
};

const progression = ProgressionManager.getInstance();
const wallet = UpgradeManager.getInstance();
const registry = EnvironmentRegistry.getInstance();
const environments = EnvironmentManager.getInstance();
const baseline = JSON.parse(JSON.stringify(progression.getState()));
let checks = 0;
function check(condition: unknown, message: string) {
  assert.ok(condition, message);
  checks++;
}
function reset(coins = 10000) {
  failWrite = () => false;
  failRead = () => false;
  data.clear();
  data.set(PROGRESSION, JSON.stringify(baseline));
  progression.load();
  wallet.setCoins(coins);
  walletWrites = 0;
}
function saved() { return JSON.parse(data.get(PROGRESSION)!); }

// Old saves and standalone preferences retain all unrelated progress and currencies.
const legacy = {
  ...baseline, keys: 17, hoverboardCharges: 29, headstartBoosters: 9, scoreBoosters: 11,
  unlockedCharacters: ['char_jax', 'char_luna'], selectedCharacter: 'char_luna',
  unlockedBoards: ['board_urban_glide', 'board_test'], selectedBoard: 'board_test',
  selectedOutfits: { ...baseline.selectedOutfits, char_luna: 'luna_neon' },
  lifetimeStats: { ...baseline.lifetimeStats, totalCoins: 8123, bestScore: 98765 }
};
delete legacy.unlockedThemes;
delete legacy.selectedTheme;
delete legacy.includePremiumThemesInDynamic;
data.set(PROGRESSION, JSON.stringify(legacy));
data.set(LEGACY, 'NEON_INDUSTRIAL');
wallet.setCoins(4321);
progression.load();
check(progression.getSelectedTheme() === 'NEON_INDUSTRIAL', 'Legacy Neon preference migrates');
check(environments.getStartingEnvironment() === 'NEON_INDUSTRIAL', 'Neon resolves through registry');
assert.deepEqual(progression.getUnlockedThemes(), FREE_WORLD_IDS);
for (const field of ['keys', 'hoverboardCharges', 'headstartBoosters', 'scoreBoosters', 'unlockedCharacters',
  'selectedCharacter', 'unlockedBoards', 'selectedBoard', 'selectedOutfits', 'unlockedOutfits', 'lifetimeStats',
  'activeMissions', 'dailyChallenges', 'achievements', 'seasonPass']) {
  assert.deepEqual((progression.getState() as any)[field], (legacy as any)[field], `${field} survives migration`);
  checks++;
}
check(wallet.getCoins() === 4321 && data.get(WALLET) === '4321', 'Migration leaves spendable coins intact');
check(!progression.getState().includePremiumThemesInDynamic, 'Premium Dynamic inclusion defaults off');
check(progression.saveState(), 'Migrated state persists');
data.set(LEGACY, 'HISTORIC_QUARTER');
environments.loadPreference();
check(environments.getPreference() === 'NEON_INDUSTRIAL', 'Progression selection overrides stale legacy preference');
data.delete(PROGRESSION);
data.set(LEGACY, 'UNDERGROUND_METRO');
progression.load();
check(progression.getSelectedTheme() === 'UNDERGROUND_METRO', 'Standalone preference migrates');
data.set(PROGRESSION, JSON.stringify(legacy));
failRead = (key) => key === LEGACY;
progression.load();
check(progression.getKeys() === 17 && progression.getState().lifetimeStats.bestScore === 98765,
  'Legacy preference read failure cannot reset progression');
failRead = () => false;

reset();
for (const id of FREE_WORLD_IDS) {
  check(progression.isThemeUnlocked(id), `${id} is free`);
  check(environments.savePreference(id), `${id} is selectable`);
  check(environments.getStartingEnvironment() === id && saved().selectedTheme === id, `${id} selection persists`);
}
check(!progression.purchaseTheme('NEON_INDUSTRIAL').success && wallet.getCoins() === 10000, 'Free worlds cannot be charged');
check(!progression.equipTheme('removed_world').success, 'Unknown world cannot equip');
data.set(PROGRESSION, JSON.stringify({ ...baseline, selectedTheme: 'removed_world', unlockedThemes: ['removed_world'] }));
progression.load();
check(progression.getSelectedTheme() === 'DYNAMIC' && environments.getStartingEnvironment() === 'MODERN_METRO', 'Unknown save has a valid fallback');
assert.deepEqual(progression.getUnlockedThemes(), FREE_WORLD_IDS);

// Phase 3B: All premium worlds implemented. Unknown or disabled worlds cannot be sold, equipped or planned.
reset();
check(!progression.purchaseTheme('UNKNOWN_WORLD').success, 'UNKNOWN_WORLD rejects purchase');
check(!progression.equipTheme('UNKNOWN_WORLD').success, 'UNKNOWN_WORLD rejects equip');
check(wallet.getCoins() === 10000 && walletWrites === 0, 'Unavailable purchases leave wallet untouched');
progression.equipTheme('DYNAMIC');
const freePlanner = new DistrictPlanner(12345);
const freeRoute = new Set(Array.from({ length: 100 }, (_, i) => freePlanner.getDistrictAtZ(-i * 600 - 100).districtId));
for (const id of FREE_WORLD_IDS) check(freeRoute.has(id), `Dynamic Districts can visit ${id}`);

// Phase 3C: DOOMSDAY_LAST_TRANSIT is genuinely implemented and registered in production.
const doomsdayWorld = getWorld('DOOMSDAY_LAST_TRANSIT') as any;
const doomsdayId = doomsdayWorld.id as EnvironmentId;
check(doomsdayWorld.available && doomsdayWorld.implemented, 'DOOMSDAY_LAST_TRANSIT is implemented and available in catalog');
check(registry.has(doomsdayId), 'DOOMSDAY_LAST_TRANSIT is registered in environment registry');
check(doomsdayWorld.coinCost === 7500, 'DOOMSDAY_LAST_TRANSIT costs 7500 coins');

// Phase 3B: ABYSSAL_GLASSLINE is genuinely implemented and registered in production.
const abyssalWorld = getWorld('ABYSSAL_GLASSLINE') as any;
const abyssalId = abyssalWorld.id as EnvironmentId;
check(abyssalWorld.available && abyssalWorld.implemented, 'ABYSSAL_GLASSLINE is implemented and available in catalog');
check(registry.has(abyssalId), 'ABYSSAL_GLASSLINE is registered in environment registry');
check(abyssalWorld.coinCost === 6000, 'ABYSSAL_GLASSLINE costs 6000 coins');

// Phase 3A: ORBITAL_HALO is genuinely implemented and registered in production.
const orbitalWorld = getWorld('ORBITAL_HALO') as any;
const orbitalId = orbitalWorld.id as EnvironmentId;
check(orbitalWorld.available && orbitalWorld.implemented, 'ORBITAL_HALO is implemented and available in catalog');
check(registry.has(orbitalId), 'ORBITAL_HALO is registered in environment registry');
check(orbitalWorld.coinCost === 4500, 'ORBITAL_HALO costs 4500 coins');

// Phase 2: NEON_RAINLINE is genuinely implemented and registered in production.
const future = getWorld('NEON_RAINLINE') as any;
const futureId = future.id as EnvironmentId;
check(future.available && future.implemented, 'NEON_RAINLINE is implemented and available in catalog');
check(registry.has(futureId), 'NEON_RAINLINE is registered in environment registry');
check(!progression.equipTheme(future.id).success, 'Implemented but locked world cannot equip');
reset(future.coinCost - 1);
check(!progression.purchaseTheme(future.id).success && wallet.getCoins() === future.coinCost - 1, 'Insufficient funds never deduct');
reset(future.coinCost);
check(!progression.purchaseTheme(future.id, 'KEYS').success && progression.getKeys() === baseline.keys, 'Key purchases stay disabled');
check(progression.purchaseTheme(future.id).success, 'Sufficient coins purchase permanent ownership');
check(wallet.getCoins() === 0 && walletWrites === 1, 'Exact balance is debited once, never negative');
check(!progression.purchaseTheme(future.id).success && walletWrites === 1, 'Duplicate purchase rejects without debit');
check(progression.equipTheme(future.id).success, 'Owned available world equips');
wallet.load();
progression.load();
check(progression.isThemeUnlocked(future.id) && progression.getSelectedTheme() === future.id && wallet.getCoins() === 0,
  'Ownership, selection and wallet survive reload');
const returned = progression.getUnlockedThemes();
returned.length = 0;
check(progression.isThemeUnlocked(future.id), 'Ownership getter cannot mutate save');

reset();
let reentered = false;
EventBus.getInstance().on('WALLET_UPDATED', () => {
  if (reentered) return;
  reentered = true;
  check(!progression.purchaseTheme(future.id).success, 'Reentrant double-click rejects while wallet event fires');
});
check(progression.purchaseTheme(future.id).success, 'First double-click purchase succeeds');
check(!progression.purchaseTheme(future.id).success && walletWrites === 1, 'Second double-click never charges');
check(wallet.getCoins() === 10000 - future.coinCost, 'Double-click leaves correct balance');

// Ownership save fails before any debit; previous durable state stays byte-for-byte intact.
reset();
const beforeFailure = data.get(PROGRESSION);
const warn = console.warn;
console.warn = () => {};
try {
  failWrite = (key) => key === PROGRESSION;
  check(!progression.purchaseTheme(future.id).success, 'Ownership storage failure is reported');
  check(!progression.isThemeUnlocked(future.id) && wallet.getCoins() === 10000 && walletWrites === 0,
    'Ownership write failure leaves ownership and currency intact');
  check(data.get(PROGRESSION) === beforeFailure, 'Failed write preserves prior save');

  reset();
  failWrite = (key) => key === WALLET;
  check(!progression.purchaseTheme(future.id).success, 'Payment storage failure is reported');
  check(!progression.isThemeUnlocked(future.id) && !saved().unlockedThemes.includes(future.id) && wallet.getCoins() === 10000,
    'Failed debit rolls back durable ownership without charge');

  reset();
  let progressionWrites = 0;
  failWrite = (key) => key === WALLET || (key === PROGRESSION && ++progressionWrites > 1);
  const failedRollback = progression.purchaseTheme(future.id);
  check(!failedRollback.success && failedRollback.message.includes('without charge'), 'Rollback storage failure is explicit');
  check(progression.isThemeUnlocked(future.id) && saved().unlockedThemes.includes(future.id) && wallet.getCoins() === 10000,
    'Failed rollback retains durable ownership without losing coins');
  failWrite = () => false;
  progression.load();
  check(!progression.purchaseTheme(future.id).success && wallet.getCoins() === 10000, 'Retry after failed rollback cannot charge twice');

  reset();
  failWrite = (key) => key === PROGRESSION;
  check(!progression.equipTheme('NEON_INDUSTRIAL').success && progression.getSelectedTheme() === 'DYNAMIC',
    'Failed equip write rolls back selection');
  check(!progression.setIncludePremiumThemesInDynamic(true).success && !progression.getState().includePremiumThemesInDynamic,
    'Failed Dynamic preference write rolls back');
} finally {
  failWrite = () => false;
  console.warn = warn;
}

// Deterministic planning filters locked, opted-out and unfinished premium worlds.
reset();
check(!getDynamicEnvironmentIds(progression.getState()).includes(futureId), 'Locked world excluded from Dynamic Districts');
check(progression.setIncludePremiumThemesInDynamic(true).success, 'Dynamic inclusion preference persists');
check(!getDynamicEnvironmentIds(progression.getState()).includes(futureId), 'Opt-in does not bypass ownership');
check(progression.purchaseTheme(future.id).success, 'Purchase for Dynamic filtering succeeds');
check(getDynamicEnvironmentIds(progression.getState()).includes(futureId), 'Owned implemented premium included after opt-in');
check(progression.setIncludePremiumThemesInDynamic(false).success, 'Player can opt out');
assert.deepEqual(getDynamicEnvironmentIds(progression.getState()), FREE_WORLD_IDS);
progression.setIncludePremiumThemesInDynamic(true);
progression.load();
check(progression.getState().includePremiumThemesInDynamic, 'Dynamic opt-in survives reload');
const futureOriginalAvail = future.available;
const futureOriginalImpl = future.implemented;
try {
  future.available = false;
  check(!getDynamicEnvironmentIds(progression.getState()).includes(futureId), 'Unavailable owned premium excluded');
  future.available = true;
  future.implemented = false;
  check(!getDynamicEnvironmentIds(progression.getState()).includes(futureId), 'Unfinished owned premium excluded');
  future.implemented = true;
  const modern = registry.get('MODERN_METRO');
  const transitions = modern.allowedTransitions;
  modern.allowedTransitions = [futureId];
  try {
    check(registry.getNextRandomTransition('MODERN_METRO', () => 0, undefined, [...FREE_WORLD_IDS]) !== futureId,
      'Transition filtering honors ownership candidates');
    check(registry.getNextRandomTransition('MODERN_METRO', () => 0, undefined, getDynamicEnvironmentIds(progression.getState())) === futureId,
      'Transition can select opted-in premium');
    const first = new DistrictPlanner(12345);
    const second = new DistrictPlanner(12345);
    const positions = Array.from({ length: 30 }, (_, i) => -i * 600 - 100);
    const route = (planner: DistrictPlanner) => positions.map((z) => planner.getDistrictAtZ(z).districtId);
    const premiumRoute = route(first);
    assert.deepEqual(premiumRoute, route(second));
    check(premiumRoute.includes(futureId), 'Planner includes opted-in owned premium with deterministic seed');
    progression.setIncludePremiumThemesInDynamic(false);
    check(!route(new DistrictPlanner(12345)).includes(futureId), 'Planner excludes opted-out premium');
    progression.setIncludePremiumThemesInDynamic(true);
    future.available = false;
    check(!route(new DistrictPlanner(12345)).includes(futureId), 'Planner excludes unfinished/disabled premium');
  } finally {
    modern.allowedTransitions = transitions;
  }
} finally {
  future.available = futureOriginalAvail;
  future.implemented = futureOriginalImpl;
}

// Render and apply the real modal methods using a minimal DOM; no browser/screenshots.
reset();
const handlers = new Map<string, () => void>();
const list = {
  innerHTML: '',
  appendChild: () => {},
  querySelectorAll: () => [...list.innerHTML.matchAll(/data-env-id="([^"]+)"/g)].map((match) => ({
    getAttribute: () => match[1],
    addEventListener: (_: string, handler: () => void) => { handlers.set(match[1], handler); }
  }))
};
(globalThis as any).document = { getElementById: () => list };
const modal = Object.assign(Object.create(EnvironmentSelectModal.prototype), {
  envManager: environments, selectedPreference: 'DYNAMIC', hide: () => {}
});
modal.render();
for (const id of FREE_WORLD_IDS) check(handlers.has(id), `${id} has a selectable modal card`);
check(!list.innerHTML.includes('data-env-id="NEON_RAINLINE"'), 'Locked world absent from selection modal');
handlers.get('NEON_INDUSTRIAL')!();
check(modal.selectedPreference === 'NEON_INDUSTRIAL', 'Neon card click changes selection');
let emitted = '';
EventBus.getInstance().on('ENVIRONMENT_PREFERENCE_CHANGED', (id: string) => { emitted = id; });
modal.applySelection();
check(saved().selectedTheme === 'NEON_INDUSTRIAL' && emitted === 'NEON_INDUSTRIAL', 'Apply persists Neon and emits preference change');
check(list.innerHTML.includes('env-card-option selected'), 'Modal renders the selected state');

// When unlocked, premium world appears in selection modal
progression.purchaseTheme('NEON_RAINLINE');
modal.render();
check(list.innerHTML.includes('data-env-id="NEON_RAINLINE"'), 'Unlocked premium world appears in selection modal');

const content = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
const shop = Object.assign(Object.create(ShopModal.prototype), { progression, upgradeManager: wallet });
shop.renderWorlds(content);
check((content.innerHTML.match(/COMING SOON/g) ?? []).length === 0, 'No worlds marked coming soon once all premium worlds implemented');
check(content.innerHTML.includes('data-buy-world="NEON_RAINLINE"') || content.innerHTML.includes('data-equip-world="NEON_RAINLINE"'),
  'Shop renders interactive action for implemented premium world');
check(content.innerHTML.includes('data-buy-world="ORBITAL_HALO"') || content.innerHTML.includes('data-equip-world="ORBITAL_HALO"'),
  'Shop renders interactive action for Orbital Halo');
check(content.innerHTML.includes('data-buy-world="ABYSSAL_GLASSLINE"') || content.innerHTML.includes('data-equip-world="ABYSSAL_GLASSLINE"'),
  'Shop renders interactive action for Abyssal Glassline');
check(content.innerHTML.includes('data-buy-world="DOOMSDAY_LAST_TRANSIT"') || content.innerHTML.includes('data-equip-world="DOOMSDAY_LAST_TRANSIT"'),
  'Shop renders interactive action for Doomsday Last Transit');
check(getWorlds(progression.getState()).filter((world) => world.owned).length === 5, 'All four originals + purchased Neon Rainline are owned');
progression.purchaseTheme('ORBITAL_HALO');
check(getWorlds(progression.getState()).filter((world) => world.owned).length === 6, 'All four originals + purchased Neon Rainline + Orbital Halo are owned');
wallet.addCoins(6000);
progression.purchaseTheme('ABYSSAL_GLASSLINE');
check(getWorlds(progression.getState()).filter((world) => world.owned).length === 7, 'All four originals + all three premium worlds are owned');
wallet.addCoins(7500);
progression.purchaseTheme('DOOMSDAY_LAST_TRANSIT');
check(getWorlds(progression.getState()).filter((world) => world.owned).length === 8, 'All four originals + all four premium worlds are owned');
modal.render();
check(list.innerHTML.includes('data-env-id="ORBITAL_HALO"'), 'Unlocked Orbital Halo appears in selection modal');
check(list.innerHTML.includes('data-env-id="ABYSSAL_GLASSLINE"'), 'Unlocked Abyssal Glassline appears in selection modal');
check(list.innerHTML.includes('data-env-id="DOOMSDAY_LAST_TRANSIT"'), 'Unlocked Doomsday Last Transit appears in selection modal');
check(progression.getKeys() === baseline.keys, 'World APIs preserve revive Key balance');
check(progression.consumeKeys(1) && progression.getKeys() === baseline.keys - 1, 'Existing revive Key spending still works');
check(!wallet.deductCoinsPersisted(-10) && !wallet.deductCoinsPersisted(NaN) && !wallet.deductCoinsPersisted(Infinity),
  'Durable debit rejects invalid/negative amounts');
console.log(`PASS: ${checks} premium world checks`);
