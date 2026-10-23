import { EventBus } from '../core/EventBus';
import { UpgradeManager } from '../player/UpgradeManager';
import { ProgressionManager } from './ProgressionManager';

export interface DailyRewardDay {
  day: number;
  title: string;
  coins: number;
  charges: number;
  keys?: number;
  icon: string;
  description: string;
  isJackpot?: boolean;
}

export const DAILY_REWARDS_SCHEDULE: DailyRewardDay[] = [
  { day: 1, title: 'Day 1 Bonus', coins: 500, charges: 0, keys: 0, icon: '🪙', description: '+500 Starter Coins' },
  { day: 2, title: 'Day 2 Mobility', coins: 250, charges: 2, keys: 0, icon: '🛹', description: '+2 Hoverboard Charges & 250 Coins' },
  { day: 3, title: 'Day 3 Stash', coins: 1000, charges: 0, keys: 1, icon: '🗝️', description: '+1,000 Gold Coins & 1 Revive Key' },
  { day: 4, title: 'Day 4 Skater', coins: 500, charges: 3, keys: 0, icon: '🛹', description: '+3 Hoverboard Charges & 500 Coins' },
  { day: 5, title: 'Day 5 Bankroll', coins: 2500, charges: 0, keys: 0, icon: '💎', description: '+2,500 High-Roller Coins' },
  { day: 6, title: 'Day 6 Mega Pack', coins: 1500, charges: 5, keys: 0, icon: '🚀', description: '+5 Hoverboard Charges & 1,500 Coins' },
  { day: 7, title: 'Day 7 Jackpot', coins: 5000, charges: 10, keys: 2, icon: '👑', description: 'EPIC JACKPOT: 5,000 Coins, 10 Charges & 2 Revive Keys!', isJackpot: true }
];

const DAILY_STORAGE_KEY = 'metro_daily_reward_state';

interface DailyRewardState {
  currentDayIndex: number; // 0 to 6 (Day 1 to 7)
  lastClaimDate: string | null; // YYYY-MM-DD
  totalClaimsCount: number;
}

export class DailyRewardManager {
  private static instance: DailyRewardManager;
  private state: DailyRewardState;
  private eventBus = EventBus.getInstance();

  private constructor() {
    this.state = this.loadState();
  }

  public static getInstance(): DailyRewardManager {
    if (!DailyRewardManager.instance) {
      DailyRewardManager.instance = new DailyRewardManager();
    }
    return DailyRewardManager.instance;
  }

  private getTodayDateStr(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getYesterdayDateStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private loadState(): DailyRewardState {
    const defaultState: DailyRewardState = {
      currentDayIndex: 0,
      lastClaimDate: null,
      totalClaimsCount: 0
    };

    if (typeof localStorage === 'undefined') return defaultState;

    try {
      const raw = localStorage.getItem(DAILY_STORAGE_KEY);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw);
      return {
        currentDayIndex: typeof parsed.currentDayIndex === 'number' ? parsed.currentDayIndex : 0,
        lastClaimDate: parsed.lastClaimDate || null,
        totalClaimsCount: typeof parsed.totalClaimsCount === 'number' ? parsed.totalClaimsCount : 0
      };
    } catch (e) {
      return defaultState;
    }
  }

  private saveState(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save daily reward state:', e);
    }
  }

  /**
   * Check if today's reward is available to claim
   */
  public isClaimAvailable(): boolean {
    const today = this.getTodayDateStr();
    return this.state.lastClaimDate !== today;
  }

  /**
   * Current day in the 7-day calendar (1 to 7)
   */
  public getCurrentDayNumber(): number {
    return (this.state.currentDayIndex % 7) + 1;
  }

  /**
   * Total lifetime daily rewards claimed
   */
  public getTotalClaimsCount(): number {
    return this.state.totalClaimsCount;
  }

  /**
   * Returns list of 7 days with status: CLAIMED, CLAIMABLE, LOCKED
   */
  public getScheduleStatus(): Array<{
    day: DailyRewardDay;
    status: 'CLAIMED' | 'CLAIMABLE' | 'LOCKED';
  }> {
    const activeDayIdx = this.state.currentDayIndex % 7;
    const canClaim = this.isClaimAvailable();

    return DAILY_REWARDS_SCHEDULE.map((reward, idx) => {
      let status: 'CLAIMED' | 'CLAIMABLE' | 'LOCKED';
      if (idx < activeDayIdx) {
        status = 'CLAIMED';
      } else if (idx === activeDayIdx) {
        status = canClaim ? 'CLAIMABLE' : 'CLAIMED';
      } else {
        status = 'LOCKED';
      }
      return { day: reward, status };
    });
  }

  /**
   * Claim today's daily reward
   */
  public claimTodayReward(): { success: boolean; reward?: DailyRewardDay; reason?: string } {
    if (!this.isClaimAvailable()) {
      return { success: false, reason: 'Already claimed today! Next reward unlocks at midnight.' };
    }

    const today = this.getTodayDateStr();
    const activeDayIdx = this.state.currentDayIndex % 7;
    const reward = DAILY_REWARDS_SCHEDULE[activeDayIdx];

    // Check if streak was broken (missed yesterday)
    // If lastClaimDate exists and is neither yesterday nor today, reset streak to Day 1
    if (this.state.lastClaimDate && this.state.lastClaimDate !== this.getYesterdayDateStr()) {
      // Streak broken, reset to index 0
      this.state.currentDayIndex = 0;
    }

    const actualReward = DAILY_REWARDS_SCHEDULE[this.state.currentDayIndex % 7];

    // Apply reward to real economy
    if (actualReward.coins > 0) {
      UpgradeManager.getInstance().addCoins(actualReward.coins);
    }
    if (actualReward.charges > 0) {
      ProgressionManager.getInstance().addHoverboardCharges(actualReward.charges);
    }
    if (actualReward.keys && actualReward.keys > 0) {
      ProgressionManager.getInstance().addKeys(actualReward.keys);
    }

    // Update state
    this.state.lastClaimDate = today;
    this.state.currentDayIndex = (this.state.currentDayIndex + 1) % 7;
    this.state.totalClaimsCount++;
    this.saveState();

    this.eventBus.emit('DAILY_REWARD_CLAIMED', actualReward);
    return { success: true, reward: actualReward };
  }

  /**
   * Time remaining until midnight reset
   */
  public getTimeUntilReset(): string {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
