import assert from 'node:assert/strict';
import { MissionsModal } from '../src/ui/MissionsModal';
import { ACHIEVEMENTS } from '../src/progression/MissionCatalog';
const state: any = {
  currentMissionSet: 2,
  activeMissions: [
    { id: 'partial', title: 'Partial mission', description: 'Real objective description', progress: 25, target: 100, rewardCoins: 250, completed: false, claimed: false },
    { id: 'ready', title: 'Complete mission', description: 'Ready objective', progress: 150, target: 100, rewardCoins: 500, completed: true, claimed: false },
    { id: 'claimed', title: 'Claimed mission', description: 'Past objective', progress: 100, target: 100, rewardCoins: 500, completed: true, claimed: true }
  ],
  dailyDate: '2026-11-03', dailyChallenges: [], achievements: {},
  seasonPass: { seasonName: 'Test season', theme: 'Test theme', startDate: '2026-10-01', endDate: '2026-11-30', tokensCollected: 25, claimedMilestones: [0], milestones: [
    { milestoneIndex: 0, tokensRequired: 10, rewardIcon: '🪙', rewardLabel: '500 coins' },
    { milestoneIndex: 1, tokensRequired: 25, rewardIcon: '🛹', rewardLabel: '3 board charges' },
    { milestoneIndex: 2, tokensRequired: 50, rewardIcon: '🔑', rewardLabel: '3 keys' }
  ] }
};
state.dailyChallenges = [{ ...state.activeMissions[0], id: 'daily', badgeIcon: '📅' }];
for (const def of ACHIEVEMENTS) state.achievements[def.id] = { currentProgress: 0, completedTiers: [], claimedTiers: [] };
const distance = ACHIEVEMENTS.find(def => def.id === 'ach_distance')!;
const gold = distance.tiers.find(tier => tier.tier === 'GOLD')!;
state.achievements.ach_distance = { currentProgress: gold.target, completedTiers: ['BRONZE', 'SILVER', 'GOLD'], claimedTiers: ['BRONZE', 'SILVER'] };
const content = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
const modal = Object.assign(Object.create(MissionsModal.prototype), { progression: { getState: () => state, getTimeUntilDailyReset: () => ({ formatted: '01:23:45' }) }, contentContainer: content, achievementCategory: 'ALL' }) as any;
modal.renderMissionsTab();
assert.equal((content.innerHTML.match(/data-objective-id=/g) || []).length, 3);
assert.match(content.innerHTML, /Progress: 25 \/ 100/);
assert.match(content.innerHTML, /width: 25%/);
assert.match(content.innerHTML, /Progress: 150 \/ 100/);
assert.match(content.innerHTML, /aria-valuenow="100"/);
assert.equal((content.innerHTML.match(/data-action="claim-mission"/g) || []).length, 1);
assert.match(content.innerHTML, /CLAIMED/);
modal.renderDailyTab(); assert.match(content.innerHTML, /01:23:45/); assert.match(content.innerHTML, /2026-11-03/);
modal.renderAchievementsTab();
assert.equal((content.innerHTML.match(/data-achievement-id=/g) || []).length, ACHIEVEMENTS.length);
assert.match(content.innerHTML, /data-tier="GOLD"/);
assert.ok(content.innerHTML.includes(`${gold.rewardCoins.toLocaleString()} COINS + ${gold.rewardKeys} KEY`));
assert.match(content.innerHTML, /BRONZE · CLAIMED/);
modal.achievementCategory = 'DISTANCE'; modal.renderAchievementsTab();
assert.equal((content.innerHTML.match(/data-achievement-id=/g) || []).length, ACHIEVEMENTS.filter(def => def.category === 'DISTANCE').length);
assert.ok(!content.innerHTML.includes('data-achievement-id="ach_coins"'));
modal.renderSeasonTab();
assert.equal((content.innerHTML.match(/data-milestone=/g) || []).length, 3);
assert.equal((content.innerHTML.match(/data-action="claim-season"/g) || []).length, 1);
assert.match(content.innerHTML, /CLAIMED/); assert.match(content.innerHTML, /LOCKED/);
assert.match(content.innerHTML, /Progress: 25 \/ 50/);
console.log('VERDICT: PASS — manager-backed progress/rewards/states, achievement categories and key rewards, season claim visibility');
