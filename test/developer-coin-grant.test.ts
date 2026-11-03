import { EventBus } from '../src/core/EventBus';
import {
  ProgressionManager,
  DEV_COIN_GRANT_AMOUNT,
  DEV_COIN_GRANT_STORAGE_KEY
} from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';

console.log('🧪 Starting Localhost Developer Coin Grant Verification Suite...\n');

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
  getItem: (key: string) => storageMock[key] ?? null,
  setItem: (key: string, val: string) => { storageMock[key] = String(val); },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] ?? null,
  length: Object.keys(storageMock).length
} as any;

function setMockHostname(hostname: string | null) {
  if (hostname === null) {
    delete (globalThis as any).window;
  } else {
    (globalThis as any).window = {
      location: {
        hostname
      }
    };
  }
}

// =========================================================================
// Suite 1: Localhost Environment Detection Safety & Boundaries
// =========================================================================
console.log('--- Suite 1: Localhost Environment Detection Safety ---');
{
  const prog = ProgressionManager.getInstance();

  // Non-browser / Node context (no window)
  setMockHostname(null);
  assert(!prog.isLocalhost(), 'isLocalhost returns false when window is undefined');

  // Production domains
  setMockHostname('subwaysurfers.game');
  assert(!prog.isLocalhost(), 'isLocalhost returns false for production domain subwaysurfers.game');

  setMockHostname('dharaksh2807-svg.github.io');
  assert(!prog.isLocalhost(), 'isLocalhost returns false for production github.io host');

  setMockHostname('subway-surfers.pages.dev');
  assert(!prog.isLocalhost(), 'isLocalhost returns false for Cloudflare Pages production host');

  setMockHostname('subway-surfers.vercel.app');
  assert(!prog.isLocalhost(), 'isLocalhost returns false for Vercel production host');

  setMockHostname('192.168.1.45');
  assert(!prog.isLocalhost(), 'isLocalhost returns false for local LAN IP (strictly localhost only)');

  // Localhost development origins
  setMockHostname('localhost');
  assert(prog.isLocalhost(), 'isLocalhost returns true for "localhost"');

  setMockHostname('LOCALHOST');
  assert(prog.isLocalhost(), 'isLocalhost handles case-insensitivity ("LOCALHOST")');

  setMockHostname('127.0.0.1');
  assert(prog.isLocalhost(), 'isLocalhost returns true for IPv4 loopback "127.0.0.1"');

  setMockHostname('[::1]');
  assert(prog.isLocalhost(), 'isLocalhost returns true for IPv6 loopback "[::1]"');

  setMockHostname('dev.local.localhost');
  assert(prog.isLocalhost(), 'isLocalhost returns true for RFC 6761 .localhost domain');
}

// =========================================================================
// Suite 2: Production Lockout — Zero Grant in Production
// =========================================================================
console.log('\n--- Suite 2: Production Lockout ---');
{
  storageMock['metro_runner_wallet'] = '250';
  delete storageMock['metro_dev_coin_grant_applied'];

  const wallet = UpgradeManager.getInstance();
  wallet.load();
  assert(wallet.getCoins() === 250, 'Initial wallet coins loaded correctly (250)');

  // Set production hostname
  setMockHostname('dharaksh2807-svg.github.io');

  const prog = ProgressionManager.getInstance();
  const grantResult = prog.checkDeveloperCoinGrant();

  assert(!grantResult, 'checkDeveloperCoinGrant() returned false on production host');
  assert(wallet.getCoins() === 250, 'Wallet coins remain completely unchanged (250) on production host');
  assert(storageMock[DEV_COIN_GRANT_STORAGE_KEY] === undefined, 'Storage flag was not set on production host');
}

// =========================================================================
// Suite 3: Localhost Developer Coin Grant & Existing Profile Preservation
// =========================================================================
console.log('\n--- Suite 3: Localhost Developer Coin Grant ---');
{
  // Setup existing profile with characters, themes, keys, and 750 coins
  storageMock['metro_runner_wallet'] = '750';
  delete storageMock[DEV_COIN_GRANT_STORAGE_KEY];

  const existingProgression = {
    version: 1,
    currentMissionSet: 3,
    unlockedCharacters: ['char_jax', 'char_luna', 'char_modi'],
    selectedCharacter: 'char_modi',
    unlockedThemes: ['DEFAULT_CITY', 'SUBWAY_TUNNEL', 'VIP_EXPRESS', 'NEON_RAINLINE'],
    selectedTheme: 'VIP_EXPRESS',
    keys: 18,
    hoverboardCharges: 9,
    lifetimeStats: { totalDistance: 45000, totalCoins: 2100, bestScore: 120000 },
    devCoinGrantApplied: false
  };
  storageMock['metro_progression_v1'] = JSON.stringify(existingProgression);

  // Switch to localhost
  setMockHostname('localhost');

  const wallet = UpgradeManager.getInstance();
  wallet.load();
  assert(wallet.getCoins() === 750, 'Pre-grant wallet balance is 750 coins');

  const prog = ProgressionManager.getInstance();
  prog.load();

  // Verify grant was applied
  assert(prog.getState().devCoinGrantApplied === true, 'devCoinGrantApplied flag set to true in progression state');
  assert(storageMock[DEV_COIN_GRANT_STORAGE_KEY] === 'true', 'Dedicated storage key set to "true"');
  assert(
    wallet.getCoins() === 750 + DEV_COIN_GRANT_AMOUNT,
    `Wallet coins increased by exactly ${DEV_COIN_GRANT_AMOUNT.toLocaleString()} (expected: 1,000,000,750, got: ${wallet.getCoins()})`
  );
  assert(
    prog.getCoins() === 750 + DEV_COIN_GRANT_AMOUNT,
    'ProgressionManager.getCoins() delegates accurately to wallet balance'
  );

  // Verify ALL existing progression state is fully preserved
  const state = prog.getState();
  assert(state.unlockedCharacters.includes('char_modi'), 'Existing unlocked character char_modi preserved');
  assert(state.unlockedCharacters.includes('char_luna'), 'Existing unlocked character char_luna preserved');
  assert(state.selectedCharacter === 'char_modi', 'Selected character preserved as char_modi');
  assert(state.unlockedThemes.includes('VIP_EXPRESS'), 'Existing unlocked theme VIP_EXPRESS preserved');
  assert(state.unlockedThemes.includes('NEON_RAINLINE'), 'Existing unlocked theme NEON_RAINLINE preserved');
  assert(state.selectedTheme === 'VIP_EXPRESS', 'Selected theme preserved as VIP_EXPRESS');
  assert(state.keys === 18, 'Existing keys count preserved (18)');
  assert(state.hoverboardCharges === 9, 'Existing hoverboard charges preserved (9)');
  assert(state.lifetimeStats.bestScore === 120000, 'Existing lifetime stats preserved (120,000)');
  assert(state.currentMissionSet === 3, 'Existing mission set preserved (3)');
}

// =========================================================================
// Suite 4: Single Grant Verification — Never on Every Reload
// =========================================================================
console.log('\n--- Suite 4: Single Grant Verification on Subsequent Reloads ---');
{
  const wallet = UpgradeManager.getInstance();
  const prog = ProgressionManager.getInstance();

  const balanceBeforeReload = wallet.getCoins(); // 1,000,000,750

  // Simulate first reload
  prog.load();
  wallet.load();

  assert(
    wallet.getCoins() === balanceBeforeReload,
    `Coins did NOT increase on reload 1 (still ${wallet.getCoins()})`
  );

  // Explicit checkDeveloperCoinGrant call
  const secondCallResult = prog.checkDeveloperCoinGrant();
  assert(!secondCallResult, 'checkDeveloperCoinGrant() returns false when already applied');
  assert(
    wallet.getCoins() === balanceBeforeReload,
    `Coins did NOT increase after second check (still ${wallet.getCoins()})`
  );

  // Simulate second reload
  prog.load();
  wallet.load();

  assert(
    wallet.getCoins() === balanceBeforeReload,
    `Coins did NOT increase on reload 2 (still ${wallet.getCoins()})`
  );
}

// =========================================================================
// Suite 5: Normal Purchases Deduct Coins Correctly
// =========================================================================
console.log('\n--- Suite 5: Normal Purchases Deduct Coins Correctly ---');
{
  const wallet = UpgradeManager.getInstance();
  const prog = ProgressionManager.getInstance();

  const balanceBefore = wallet.getCoins(); // 1,000,000,750

  // Purchase a character using coins (Cruz costs 3,000 coins)
  const purchaseCharResult = prog.purchaseCharacter('char_cruz');
  assert(purchaseCharResult.success, 'Purchased character Cruz for 3,000 coins');
  assert(
    wallet.getCoins() === balanceBefore - 3000,
    `Wallet balance reduced by 3,000 coins (got: ${wallet.getCoins()})`
  );
  assert(prog.isCharacterUnlocked('char_cruz'), 'Cruz is now unlocked in progression state');

  // Purchase a premium world using durable persisted debit (Orbital Halo costs 4,500 coins)
  const balanceBeforeWorld = wallet.getCoins();
  const purchaseWorldResult = prog.purchaseTheme('ORBITAL_HALO');
  assert(purchaseWorldResult.success, 'Purchased premium world ORBITAL_HALO for 4,500 coins');
  assert(
    wallet.getCoins() === balanceBeforeWorld - 4500,
    `Wallet balance reduced by 4,500 coins (got: ${wallet.getCoins()})`
  );
  assert(prog.isThemeUnlocked('ORBITAL_HALO'), 'ORBITAL_HALO is now unlocked in progression state');

  // Purchase hoverboard charges (costs 300 coins)
  const balanceBeforeCharges = wallet.getCoins();
  const chargesResult = prog.purchaseHoverboardCharges();
  assert(chargesResult.success, 'Purchased hoverboard charges for 300 coins');
  assert(
    wallet.getCoins() === balanceBeforeCharges - 300,
    `Wallet balance reduced by 300 coins (got: ${wallet.getCoins()})`
  );

  // Simulate browser reload after purchases
  const finalBalance = wallet.getCoins();
  prog.load();
  wallet.load();

  assert(
    wallet.getCoins() === finalBalance,
    `Deducted coin balance persisted accurately across reload (${wallet.getCoins()})`
  );
  assert(
    prog.isCharacterUnlocked('char_cruz'),
    'Purchased character Cruz remains permanently unlocked after reload'
  );
  assert(
    prog.isThemeUnlocked('ORBITAL_HALO'),
    'Purchased world ORBITAL_HALO remains permanently unlocked after reload'
  );
}

// =========================================================================
// Suite 6: ProgressionManager Wallet Delegation Helpers
// =========================================================================
console.log('\n--- Suite 6: ProgressionManager Wallet Delegation Helpers ---');
{
  const prog = ProgressionManager.getInstance();
  const wallet = UpgradeManager.getInstance();

  const curCoins = prog.getCoins();
  assert(curCoins === wallet.getCoins(), 'prog.getCoins() exactly matches wallet.getCoins()');

  prog.addCoins(100);
  assert(prog.getCoins() === curCoins + 100, 'prog.addCoins(100) correctly increments wallet');
  assert(wallet.getCoins() === curCoins + 100, 'wallet.getCoins() reflects prog.addCoins() increment');
}

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests} OF ${totalTests} DEVELOPER COIN GRANT TESTS PASSED!`);
console.log('=======================================================\n');
