import { DailyRewardManager, DAILY_REWARDS_SCHEDULE } from '../src/progression/DailyRewardManager';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';

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

console.log('🧪 Starting Task 7: Premium Lobby, Shop, Profile & Daily Rewards Test Suite...\n');

// ========================================================
// TEST 1: Daily Reward Calendar & 7-Day Schedule
// ========================================================
console.log('--- Test 1: Daily Reward Calendar & 7-Day Schedule ---');
const dailyManager = DailyRewardManager.getInstance();
const schedule = DAILY_REWARDS_SCHEDULE;

assert(schedule.length === 7, `Schedule contains exactly 7 daily rewards (found ${schedule.length})`);
assert(schedule[0].day === 1 && schedule[0].coins === 500, 'Day 1 reward provides 500 coins');
assert(schedule[6].day === 7 && schedule[6].isJackpot === true, 'Day 7 is designated as Grand Jackpot');
assert(schedule[6].coins === 5000 && schedule[6].charges === 10, 'Day 7 Jackpot grants 5,000 coins + 10 hoverboard charges');

const timeUntilReset = dailyManager.getTimeUntilReset();
assert(typeof timeUntilReset === 'string' && timeUntilReset.includes(':'), `Reset timer string formatted correctly (${timeUntilReset})`);

// ========================================================
// TEST 2: Daily Reward Claim Logic & Duplicate Prevention
// ========================================================
console.log('--- Test 2: Daily Reward Claim Logic & Duplicate Prevention ---');
const upgradeManager = UpgradeManager.getInstance();
upgradeManager.resetAll();
const startCoins = upgradeManager.getCoins();

assert(dailyManager.isClaimAvailable(), 'Player can claim daily reward on day 1');
const claimResult1 = dailyManager.claimTodayReward();
assert(claimResult1.success === true, 'Day 1 claim successfully executed');
assert(claimResult1.reward?.day === 1, 'Claimed day 1 reward');
assert(upgradeManager.getCoins() === startCoins + 500, `Coins correctly increased by 500 (from ${startCoins} to ${upgradeManager.getCoins()})`);
assert(!dailyManager.isClaimAvailable(), 'Cannot claim reward twice on the same day');

const duplicateAttempt = dailyManager.claimTodayReward();
assert(duplicateAttempt.success === false, 'Duplicate claim rejected on same day');
assert(upgradeManager.getCoins() === startCoins + 500, 'Coin balance unchanged after duplicate attempt');

// Verify localStorage persistence for daily rewards
const rawPersistedDaily = mockStorage.getItem('metro_daily_reward_state');
assert(rawPersistedDaily !== null, 'Daily reward state persisted to localStorage');
const parsedDaily = JSON.parse(rawPersistedDaily!);
assert(parsedDaily.totalClaimsCount === 1, 'Persisted total claims count is 1');
assert(parsedDaily.lastClaimDate !== null, 'Persisted lastClaimDate is set');

// ========================================================
// TEST 3: Shop Booster Economy & Inventory Management
// ========================================================
console.log('--- Test 3: Shop Booster Economy & Inventory Management ---');
const progression = ProgressionManager.getInstance();

// Initial booster state (players start with 2 complimentary boosters)
const initialHeadstarts = progression.getHeadstartCount();
const initialScoreBoosters = progression.getScoreBoosterCount();
assert(initialHeadstarts >= 1, `Initial Headstart boosters available (${initialHeadstarts})`);
assert(initialScoreBoosters >= 1, `Initial Score Boosters available (${initialScoreBoosters})`);

// Insufficient coins test
upgradeManager.resetAll(); // sets coins to 0
const failHeadstart = progression.purchaseHeadstart();
assert(failHeadstart.success === false, 'Purchase Headstart rejected when wallet has 0 coins');
assert(progression.getHeadstartCount() === initialHeadstarts, 'Headstart inventory unaffected by failed purchase');

// Fund wallet with 2000 coins
upgradeManager.addCoins(2000);
const prePurchaseCoins = upgradeManager.getCoins();

// Purchase Headstart (+1 for 400 coins)
const buyHeadstart = progression.purchaseHeadstart();
assert(buyHeadstart.success === true, 'Headstart purchase succeeded with sufficient funds');
assert(progression.getHeadstartCount() === initialHeadstarts + 1, 'Headstart inventory increased by 1');
assert(upgradeManager.getCoins() === prePurchaseCoins - 400, 'Wallet deducted 400 coins for Headstart');

// Purchase Score Booster (+1 for 500 coins)
const preBoosterCoins = upgradeManager.getCoins();
const buyScoreBooster = progression.purchaseScoreBooster();
assert(buyScoreBooster.success === true, 'Score Booster purchase succeeded');
assert(progression.getScoreBoosterCount() === initialScoreBoosters + 1, 'Score Booster inventory increased by 1');
assert(upgradeManager.getCoins() === preBoosterCoins - 500, 'Wallet deducted 500 coins for Score Booster');

// Purchase Board Megapack (+10 hoverboards for 850 coins)
const preCharges = progression.getHoverboardCharges();
const preChargesCoins = upgradeManager.getCoins();
const buyMegapack = progression.purchaseBoardMegapack();
assert(buyMegapack.success === true, 'Board Megapack purchase succeeded');
assert(progression.getHoverboardCharges() === preCharges + 10, `Hoverboard charges increased from ${preCharges} to ${preCharges + 10}`);
assert(upgradeManager.getCoins() === preChargesCoins - 850, 'Wallet deducted 850 coins for Board Megapack');

// ========================================================
// TEST 4: Player Profile Lifetime Telemetry & Rank Metrics
// ========================================================
console.log('--- Test 4: Player Profile Lifetime Telemetry & Rank Metrics ---');
const stats = progression.getLifetimeStats();
assert(typeof stats.bestScore === 'number', 'Lifetime stats contains bestScore');
assert(typeof stats.totalDistance === 'number', 'Lifetime stats contains totalDistance');
assert(typeof stats.totalCoins === 'number', 'Lifetime stats contains totalCoins');
assert(typeof stats.totalRuns === 'number', 'Lifetime stats contains totalRuns');
assert(typeof stats.totalJumps === 'number', 'Lifetime stats contains totalJumps');
assert(typeof stats.totalSlides === 'number', 'Lifetime stats contains totalSlides');
assert(typeof stats.totalDodges === 'number', 'Lifetime stats contains totalDodges');
assert(typeof stats.totalHoverboardsUsed === 'number', 'Lifetime stats contains totalHoverboardsUsed');

// Test mission and achievement getters
const activeMissions = progression.getActiveMissions();
assert(Array.isArray(activeMissions) && activeMissions.length === 3, 'Progression provides active missions (3 missions in set)');

const achievementsList = progression.getAchievementsList();
assert(Array.isArray(achievementsList) && achievementsList.length >= 8, `Progression provides achievements list (${achievementsList.length} achievements)`);

console.log('\n=======================================================');
console.log('🏆 ALL TASK 7 UI, SHOP & PROGRESSION TESTS PASSED!');
console.log('=======================================================\n');
