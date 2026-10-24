import { EventBus, EVENTS } from '../src/core/EventBus';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import {
  generateDailyChallenges,
  getMissionsForSet,
  ACHIEVEMENTS,
  DEFAULT_SEASON_PASS,
  GAME_MODES
} from '../src/progression/MissionCatalog';

console.log('🧪 Starting Task 4: Progression, Missions, Challenges, Achievements & Events Test Suite...\n');

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
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
} as any;

// =========================================================================
// Test Suite 1: Centralized Gameplay-Event System & Standardized Events
// =========================================================================
console.log('--- Test 1: Standardized Gameplay Event Bus ---');
{
  const bus = EventBus.getInstance();
  const received: string[] = [];

  const requiredEvents = [
    EVENTS.RUN_STARTED,
    EVENTS.RUN_FINISHED,
    EVENTS.DISTANCE_TRAVELED,
    EVENTS.COIN_COLLECTED,
    EVENTS.POWERUP_COLLECTED,
    EVENTS.POWERUP_ACTIVATED,
    EVENTS.OBSTACLE_DODGED,
    EVENTS.JUMP_COMPLETED,
    EVENTS.SLIDE_COMPLETED,
    EVENTS.NEAR_MISS,
    EVENTS.BOARD_ACTIVATED,
    EVENTS.SCORE_UPDATED
  ];

  requiredEvents.forEach(evt => {
    bus.on(evt, () => received.push(evt));
  });

  requiredEvents.forEach(evt => {
    bus.emit(evt, 100);
  });

  assert(received.length === requiredEvents.length, `All ${requiredEvents.length} required gameplay events dispatched and received`);
  assert(requiredEvents.every(e => received.includes(e)), 'Event bus carries all standardized event constants');
}

// =========================================================================
// Test Suite 2: Mission Sets Progression, Counter Updates & Idempotent Claiming
// =========================================================================
console.log('\n--- Test 2: Mission Sets Progression & Single-Claim Security ---');
{
  localStorage.clear();
  const bus = EventBus.getInstance();
  const progression = ProgressionManager.getInstance();
  const upgrades = UpgradeManager.getInstance();

  const startCoins = upgrades.getCoins();
  const state = progression.getState();

  assert(state.currentMissionSet === 1, 'Initial mission set starts at Set 1');
  assert(state.activeMissions.length === 3, 'Group of exactly three achievable missions active');

  const m1 = state.activeMissions.find(m => m.type === 'DISTANCE')!;
  const m2 = state.activeMissions.find(m => m.type === 'COINS')!;
  const m3 = state.activeMissions.find(m => m.type === 'JUMPS')!;

  assert(m1 !== undefined && m2 !== undefined && m3 !== undefined, 'Set 1 has Distance, Coins, and Jump missions');
  assert(m1.progress === 0 && !m1.completed && !m1.claimed, 'Mission counters initialized to 0');

  // Trigger gameplay events
  bus.emit(EVENTS.DISTANCE_TRAVELED, 250);
  assert(m1.progress === 250, 'Distance traveled increments mission progress correctly (+250m)');
  assert(!m1.completed, 'Mission not completed before target (250/500)');

  // Complete m1
  bus.emit(EVENTS.DISTANCE_TRAVELED, 260);
  assert(m1.progress >= 500, 'Mission reached target (500m)');
  assert(m1.completed === true, 'Mission m1 marked completed');
  assert(m1.claimed === false, 'Mission m1 not yet claimed');

  // Claim m1 reward
  const claim1 = progression.claimMissionReward(m1.id);
  assert(claim1.success === true, 'First claim succeeded');
  assert(claim1.coinsGranted === m1.rewardCoins, `Granted exact mission reward: ${m1.rewardCoins} coins`);
  assert(upgrades.getCoins() === startCoins + m1.rewardCoins, 'Player wallet increased by reward amount');
  assert(m1.claimed === true, 'Mission m1 marked claimed');

  // Attempt duplicate claim (Anti-farming protection)
  const claimDuplicate = progression.claimMissionReward(m1.id);
  assert(claimDuplicate.success === false, 'Duplicate claim rejected');
  assert(claimDuplicate.coinsGranted === 0, 'Zero coins granted on duplicate claim');
  assert(upgrades.getCoins() === startCoins + m1.rewardCoins, 'Wallet unchanged after duplicate claim attempt');

  // Complete and claim m2 and m3 to test Set advancement
  for (let i = 0; i < 55; i++) {
    bus.emit(EVENTS.COIN_COLLECTED);
  }
  assert(m2.completed === true, 'Coins mission completed');
  progression.claimMissionReward(m2.id);

  for (let i = 0; i < 12; i++) {
    bus.emit(EVENTS.JUMP_COMPLETED);
  }
  assert(m3.completed === true, 'Jumps mission completed');
  const claim3 = progression.claimMissionReward(m3.id);
  assert(claim3.advancedSet === true, 'Set promotion triggered when all 3 missions are claimed');
  assert(progression.getState().currentMissionSet === 2, 'Advanced to Mission Set 2');
  assert(progression.getState().activeMissions.length === 3, 'Set 2 has three fresh missions loaded');
  assert(progression.getState().activeMissions[0].set === 2, 'Active missions tagged as Set 2');
}

// =========================================================================
// Test Suite 3: Daily Challenges, Local Calendar Reset & Real Countdown
// =========================================================================
console.log('\n--- Test 3: Daily Challenges, Calendar Boundaries & Real Midnight Countdown ---');
{
  const progression = ProgressionManager.getInstance();
  const upgrades = UpgradeManager.getInstance();
  const state = progression.getState();

  // 1. Verify 5 distinct daily objectives
  assert(state.dailyChallenges.length === 5, 'Daily challenge system contains 5 rotating objectives');
  const types = state.dailyChallenges.map(c => c.type);
  assert(types.includes('DAILY_COIN'), '1. Daily coin target present');
  assert(types.includes('DAILY_DISTANCE'), '2. Daily distance target present');
  assert(types.includes('DAILY_SCORE'), '3. Daily score target present');
  assert(types.includes('DAILY_ACTION'), '4. Action-specific objective present');
  assert(types.includes('DAILY_SPECIAL'), '5. Special challenge present');

  // 2. Real Countdown Calculation
  const countdown = progression.getTimeUntilDailyReset();
  assert(countdown.hours >= 0 && countdown.hours <= 24, 'Calculated real hours to midnight');
  assert(countdown.minutes >= 0 && countdown.minutes <= 59, 'Calculated real minutes');
  assert(countdown.seconds >= 0 && countdown.seconds <= 59, 'Calculated real seconds');
  assert(countdown.formatted.length === 8, `Formatted real-time countdown string (${countdown.formatted})`);

  // 3. Progress preservation & single-claim security
  const coinDaily = state.dailyChallenges.find(c => c.type === 'DAILY_COIN')!;
  const target = coinDaily.target;
  const initialProgress = coinDaily.progress;

  for (let i = 0; i < target; i++) {
    EventBus.getInstance().emit(EVENTS.COIN_COLLECTED);
  }

  assert(coinDaily.completed === true, 'Daily coin challenge completed');
  const walletBefore = upgrades.getCoins();
  const claimDaily = progression.claimDailyReward(coinDaily.id);
  assert(claimDaily.success === true, 'Daily reward claimed');
  assert(upgrades.getCoins() === walletBefore + coinDaily.rewardCoins, 'Coins granted from daily reward');

  const claimDailyDup = progression.claimDailyReward(coinDaily.id);
  assert(claimDailyDup.success === false, 'Duplicate daily claim prohibited');

  // 4. Calendar date boundary test
  progression.getState().dailyDate = '2026-10-21'; // Previous calendar day
  localStorage.setItem('metro_progression_v1', JSON.stringify(progression.getState()));

  // Trigger daily reset check
  progression.checkDailyReset();
  const refreshedState = progression.getState();
  assert(refreshedState.dailyDate === progression.getTodayLocalDateStr(), 'Daily challenges rolled over to today');
  assert(refreshedState.dailyChallenges.every(c => c.progress === 0 && !c.claimed), 'New daily challenges refreshed with 0 progress');
  assert(refreshedState.currentMissionSet === 2, 'Permanent mission sets preserved across daily reset');
}

// =========================================================================
// Test Suite 4: Multi-Tiered Lifetime Achievements
// =========================================================================
console.log('\n--- Test 4: Permanent Multi-Tiered Achievements ---');
{
  const progression = ProgressionManager.getInstance();
  const upgrades = UpgradeManager.getInstance();

  assert(ACHIEVEMENTS.length >= 7, 'Comprehensive achievements catalog defined');

  // Test Distance achievement
  const achDef = ACHIEVEMENTS.find(a => a.id === 'ach_distance')!;
  assert(achDef.tiers.length === 3, 'Achievements have 3 distinct tiers: Bronze, Silver, Gold');
  assert(achDef.tiers[0].tier === 'BRONZE' && achDef.tiers[1].tier === 'SILVER' && achDef.tiers[2].tier === 'GOLD', 'Bronze/Silver/Gold tiers verified');

  // Advance distance past Bronze threshold (5,000m)
  EventBus.getInstance().emit(EVENTS.DISTANCE_TRAVELED, 5100);
  const state = progression.getState();
  const achState = state.achievements['ach_distance'];

  assert(achState.currentProgress >= 5000, 'Achievement tracks lifetime cumulative distance');
  assert(achState.completedTiers.includes('BRONZE'), 'Bronze tier automatically unlocked');
  assert(!achState.completedTiers.includes('SILVER'), 'Silver tier remains locked');

  // Claim Bronze
  const walletPre = upgrades.getCoins();
  const claimRes = progression.claimAchievementReward('ach_distance', 'BRONZE');
  assert(claimRes.success === true, 'Bronze achievement reward claimed');
  assert(upgrades.getCoins() === walletPre + achDef.tiers[0].rewardCoins, 'Tier reward coins credited');

  // Duplicate claim prevention
  const claimDup = progression.claimAchievementReward('ach_distance', 'BRONZE');
  assert(claimDup.success === false, 'Duplicate achievement claim blocked');
}

// =========================================================================
// Test Suite 5: Event Challenge Modes Mechanics
// =========================================================================
console.log('\n--- Test 5: Distinct Event Challenge Modes ---');
{
  assert(GAME_MODES.length >= 4, 'Multiple distinct game modes available');

  const hardMode = GAME_MODES.find(m => m.id === 'HARD');
  const timeTrial = GAME_MODES.find(m => m.id === 'TIME_TRIAL')!;
  const coinRush = GAME_MODES.find(m => m.id === 'COIN_RUSH')!;
  const survival = GAME_MODES.find(m => m.id === 'SURVIVAL')!;

  assert(hardMode !== undefined, 'Hard Mode verified');
  assert(timeTrial !== undefined, '1. Time Trial mode verified');
  assert(coinRush !== undefined && coinRush.targetGoal === 150, '2. Coin Rush mode verified with 150 target');
  assert(survival !== undefined, '3. Survival challenge mode verified');

  // Verify ProgressionManager mode switching
  const progression = ProgressionManager.getInstance();
  progression.setActiveGameMode('HARD');
  assert(progression.getActiveGameMode() === 'HARD', 'Game mode switches to HARD');

  progression.setActiveGameMode('TIME_TRIAL');
  assert(progression.getActiveGameMode() === 'TIME_TRIAL', 'Game mode switches to TIME_TRIAL');

  progression.setActiveGameMode('COIN_RUSH');
  assert(progression.getActiveGameMode() === 'COIN_RUSH', 'Game mode switches to COIN_RUSH');

  progression.setActiveGameMode('SURVIVAL');
  assert(progression.getActiveGameMode() === 'SURVIVAL', 'Game mode switches to SURVIVAL');

  progression.setActiveGameMode('NORMAL');
}

// =========================================================================
// Test Suite 6: Seasonal Progression Framework & Event Tokens
// =========================================================================
console.log('\n--- Test 6: Seasonal Progression & Collectible Event Tokens ---');
{
  const progression = ProgressionManager.getInstance();
  const upgrades = UpgradeManager.getInstance();
  const pass = progression.getState().seasonPass;

  assert(pass.seasonName === DEFAULT_SEASON_PASS.seasonName, 'Active seasonal event loaded with original identity');
  assert(pass.milestones.length >= 6, 'Season pass features 6 tiered milestones');

  const startTokens = pass.tokensCollected;
  // Emit seasonal token collection
  EventBus.getInstance().emit(EVENTS.SEASON_TOKEN_COLLECTED, 15);
  assert(pass.tokensCollected === startTokens + 15, 'Season tokens collected in run persist into season pass');

  // Claim milestone 1 (requires 10 tokens)
  const walletPre = upgrades.getCoins();
  const claimRes = progression.claimSeasonMilestone(0);
  assert(claimRes.success === true, 'Season milestone 1 claimed');
  assert(upgrades.getCoins() === walletPre + Number(pass.milestones[0].rewardValue), 'Milestone reward granted');

  // Duplicate claim prevention
  const claimDup = progression.claimSeasonMilestone(0);
  assert(claimDup.success === false, 'Duplicate season milestone claim blocked');
}

// =========================================================================
// Test Suite 7: Full Persistence & Safe Reloading
// =========================================================================
console.log('\n--- Test 7: Persistence Across Browser Reload ---');
{
  const progression = ProgressionManager.getInstance();
  progression.saveState();

  const rawSaved = localStorage.getItem('metro_progression_v1');
  assert(rawSaved !== null, 'Progression state saved to localStorage');

  const parsed = JSON.parse(rawSaved!);
  assert(parsed.version === 1, 'Versioned storage format validated (v1)');
  assert(parsed.currentMissionSet === 2, 'Mission Set 2 persisted');
  assert(parsed.seasonPass.tokensCollected >= 15, 'Seasonal tokens persisted');
  assert(parsed.achievements['ach_distance'].completedTiers.includes('BRONZE'), 'Achievement progress persisted');
}

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${passedTests} OF ${totalTests} PROGRESSION & MISSIONS TESTS PASSED!`);
console.log(`=======================================================\n`);
