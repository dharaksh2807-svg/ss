import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { DailyRewardManager } from '../src/progression/DailyRewardManager';

// Mock localStorage for Node test runner
class MockLocalStorage {
  public store: Record<string, string> = {};
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

console.log('🧪 Starting Task 8: State, Persistence, Migration & Anti-Exploit Guard Test Suite...\n');

// ========================================================
// TEST 1: Versioned Storage Migration
// ========================================================
console.log('--- Test 1: Versioned Storage Migration ---');
mockStorage.clear();

const legacyState = {
  lifetimeStats: {
    totalDistance: 12500,
    totalCoins: 3400,
    totalRuns: 28,
    totalJumps: 110,
    totalSlides: 85,
    totalDodges: 60,
    totalHoverboardsUsed: 14,
    bestScore: 89000,
    timeTrialHighScore: 45000,
    coinRushBestTime: 22.4,
    survivalBestDistance: 1850
  },
  unlockedCharacters: ['char_jax', 'char_luna'],
  selectedCharacter: 'char_luna',
  unlockedBoards: ['board_urban_glide', 'board_pulse_rider'],
  selectedBoard: 'board_pulse_rider',
  currentMissionSet: 2
};

mockStorage.setItem('metro_progression_v1', JSON.stringify(legacyState));

const progression = ProgressionManager.getInstance();
(progression as any).state = (progression as any).loadState();
const migrated = progression.getState();

assert(migrated.version === 1, 'Legacy schema migrated to version 1');
assert(migrated.lifetimeStats.totalDistance === 12500, 'Legacy totalDistance preserved (12,500m)');
assert(migrated.lifetimeStats.bestScore === 89000, 'Legacy bestScore preserved (89,000)');
assert(migrated.lifetimeStats.totalRuns === 28, 'Legacy totalRuns preserved (28)');
assert(migrated.unlockedCharacters.includes('char_luna'), 'Legacy unlocked character char_luna preserved');
assert(migrated.unlockedBoards.includes('board_pulse_rider'), 'Legacy unlocked board board_pulse_rider preserved');
assert(migrated.selectedCharacter === 'char_luna', 'Selected character char_luna preserved');
assert(migrated.selectedBoard === 'board_pulse_rider', 'Selected board board_pulse_rider preserved');
assert(migrated.hoverboardCharges === 5, 'Hoverboard charges backfilled with 5');
assert(migrated.headstartBoosters === 2, 'Headstart boosters backfilled with 2');
assert(migrated.scoreBoosters === 2, 'Score boosters backfilled with 2');
assert(migrated.seasonPass !== undefined, 'Season pass schema safely initialized');
assert(migrated.achievements['ach_coins'] !== undefined, 'Achievements dictionary backfilled');
assert(migrated.unlockedOutfits['char_jax'] !== undefined, 'Outfits dictionary backfilled');

// ========================================================
// TEST 2: Anti-Exploit: Mission Reward Duplicate Claim
// ========================================================
console.log('\n--- Test 2: Anti-Exploit: Mission Reward Duplicate Claim ---');
const upgradeMgr = UpgradeManager.getInstance();
upgradeMgr.setCoins(0);

const activeMissions = progression.getActiveMissions();
assert(activeMissions.length > 0, 'Active missions exist');
const targetMission = activeMissions[0];
targetMission.progress = targetMission.targetValue;
targetMission.completed = true;
targetMission.claimed = false;

const reward = targetMission.rewardCoins;
assert(reward > 0, 'Mission has positive reward coins');

const claim1 = progression.claimMissionReward(targetMission.id);
assert(claim1.success === true, 'First mission claim succeeded');
assert(claim1.coinsGranted === reward, `Granted ${reward} coins on first claim`);
assert(upgradeMgr.getCoins() === reward, 'Wallet coin balance correctly credited');

const claim2 = progression.claimMissionReward(targetMission.id);
assert(claim2.success === false, 'Duplicate mission claim rejected');
assert(claim2.coinsGranted === 0, '0 coins granted on duplicate attempt');
assert(upgradeMgr.getCoins() === reward, 'Wallet coin balance unchanged on exploit attempt');

// ========================================================
// TEST 3: Anti-Exploit: Daily Challenge Duplicate Claim
// ========================================================
console.log('\n--- Test 3: Anti-Exploit: Daily Challenge Duplicate Claim ---');
upgradeMgr.setCoins(100);

const dailyChallenges = progression.getDailyChallenges();
assert(dailyChallenges.length > 0, 'Daily challenges exist');
const challenge = dailyChallenges[0];
challenge.progress = challenge.targetValue;
challenge.completed = true;
challenge.claimed = false;

const cReward = challenge.rewardCoins;
const cClaim1 = progression.claimDailyReward(challenge.id);
assert(cClaim1.success === true, 'First daily challenge claim succeeded');
assert(upgradeMgr.getCoins() === 100 + cReward, 'Coins credited to wallet');

const cClaim2 = progression.claimDailyReward(challenge.id);
assert(cClaim2.success === false, 'Duplicate daily challenge claim rejected');
assert(cClaim2.coinsGranted === 0, '0 coins granted on exploit attempt');
assert(upgradeMgr.getCoins() === 100 + cReward, 'Wallet balance remained exactly 100 + reward');

// ========================================================
// TEST 4: Anti-Exploit: Daily Login Reward Calendar
// ========================================================
console.log('\n--- Test 4: Anti-Exploit: Daily Login Reward Calendar ---');
const dailyMgr = DailyRewardManager.getInstance();
upgradeMgr.setCoins(500);

(dailyMgr as any).state = {
  currentDayIndex: 0,
  lastClaimDate: null,
  totalClaimsCount: 0
};

assert(dailyMgr.isClaimAvailable() === true, 'Daily reward is claimable on day 1');
const dClaim1 = dailyMgr.claimTodayReward();
assert(dClaim1.success === true, 'First daily reward claim succeeded');
const grantedCoins = dClaim1.reward?.coins || 0;
assert(upgradeMgr.getCoins() === 500 + grantedCoins, 'Daily coins added to wallet');
assert(dailyMgr.isClaimAvailable() === false, 'Claim availability closed for remainder of today');

const dClaim2 = dailyMgr.claimTodayReward();
assert(dClaim2.success === false, 'Duplicate daily claim rejected on same day');
assert(upgradeMgr.getCoins() === 500 + grantedCoins, 'Wallet coins untouched on duplicate attempt');

// ========================================================
// TEST 5: Daily Reset & Streak Logic
// ========================================================
console.log('\n--- Test 5: Daily Reset & Streak Logic ---');
const yesterdayStr = (dailyMgr as any).getYesterdayDateStr();

(dailyMgr as any).state = {
  currentDayIndex: 2, // Day 3
  lastClaimDate: yesterdayStr,
  totalClaimsCount: 2
};

assert(dailyMgr.isClaimAvailable() === true, 'Claim available today following yesterday claim');
const streakClaim = dailyMgr.claimTodayReward();
assert(streakClaim.success === true, 'Streak claim succeeded');
assert(dailyMgr.getCurrentDayNumber() === 4, 'Consecutive claim advanced streak to Day 4');

// 3 days ago in local date
const threeDaysAgoDate = new Date();
threeDaysAgoDate.setDate(threeDaysAgoDate.getDate() - 3);
const threeDaysAgoY = threeDaysAgoDate.getFullYear();
const threeDaysAgoM = String(threeDaysAgoDate.getMonth() + 1).padStart(2, '0');
const threeDaysAgoD = String(threeDaysAgoDate.getDate()).padStart(2, '0');
const threeDaysAgoStr = `${threeDaysAgoY}-${threeDaysAgoM}-${threeDaysAgoD}`;

(dailyMgr as any).state = {
  currentDayIndex: 4, // Was on Day 5
  lastClaimDate: threeDaysAgoStr,
  totalClaimsCount: 4
};

const resetClaim = dailyMgr.claimTodayReward();
assert(resetClaim.success === true, 'Claim succeeded after broken streak');
assert((dailyMgr as any).state.currentDayIndex === 1, 'Broken streak safely reset to Day 1, now on Day 2');

// ========================================================
// TEST 6: Anti-Exploit: Shop Character & Board Unlocks
// ========================================================
console.log('\n--- Test 6: Anti-Exploit: Shop Character & Board Unlocks ---');
upgradeMgr.setCoins(20000);

// Cruz cost is 3,000 coins and is locked by default
assert(progression.isCharacterUnlocked('char_cruz') === false, 'Cruz is initially locked');
const buyChar1 = progression.purchaseCharacter('char_cruz');
assert(buyChar1.success === true, 'First character purchase succeeded');
assert(upgradeMgr.getCoins() === 17000, 'Exactly 3,000 coins deducted (20,000 -> 17,000)');
assert(progression.isCharacterUnlocked('char_cruz') === true, 'Character Cruz is now unlocked');

const buyChar2 = progression.purchaseCharacter('char_cruz');
assert(buyChar2.success === false, 'Duplicate character purchase rejected');
assert(upgradeMgr.getCoins() === 17000, 'Wallet unchanged after duplicate attempt');

// Board purchase: Aero Drift cost is 4,000 coins and is locked by default
assert(progression.isBoardUnlocked('board_aero_drift') === false, 'Aero Drift is initially locked');
const buyBoard1 = progression.purchaseBoard('board_aero_drift');
assert(buyBoard1.success === true, 'First board purchase succeeded');
assert(upgradeMgr.getCoins() === 13000, 'Exactly 4,000 coins deducted (17,000 -> 13,000)');
assert(progression.isBoardUnlocked('board_aero_drift') === true, 'Board Aero Drift is now unlocked');

const buyBoard2 = progression.purchaseBoard('board_aero_drift');
assert(buyBoard2.success === false, 'Duplicate board purchase rejected');
assert(upgradeMgr.getCoins() === 13000, 'Wallet unchanged after duplicate attempt');

// ========================================================
// TEST 7: Storage Corruption Tolerance
// ========================================================
console.log('\n--- Test 7: Storage Corruption Tolerance ---');
mockStorage.setItem('metro_progression_v1', 'corrupted-{{bad-json');
const corruptedLoaded = (progression as any).loadState();

assert(corruptedLoaded !== null && typeof corruptedLoaded === 'object', 'Corrupted state fell back to valid object');
assert(corruptedLoaded.version === 1, 'Version is 1');
assert(corruptedLoaded.unlockedCharacters.includes('char_jax'), 'Default hero Jax is present');

console.log('\n=======================================================');
console.log('🏆 ALL TASK 8 STATE, PERSISTENCE & ANTI-EXPLOIT TESTS PASSED!');
console.log('=======================================================\n');
