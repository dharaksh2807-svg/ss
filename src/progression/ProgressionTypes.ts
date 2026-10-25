export type MissionType = 
  | 'COINS' 
  | 'DISTANCE' 
  | 'JUMPS' 
  | 'SLIDES' 
  | 'POWERUPS' 
  | 'NEAR_MISS' 
  | 'OBSTACLES' 
  | 'SCORE';

export interface Mission {
  id: string;
  set: number;
  title: string;
  description: string;
  type: MissionType;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardCoins: number;
  inSingleRun?: boolean;
}

export type DailyChallengeType = 
  | 'DAILY_COIN' 
  | 'DAILY_DISTANCE' 
  | 'DAILY_SCORE' 
  | 'DAILY_ACTION' 
  | 'DAILY_SPECIAL';

export interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  type: DailyChallengeType;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardCoins: number;
  badgeIcon: string;
}

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface TierConfig {
  tier: AchievementTier;
  target: number;
  rewardCoins: number;
  rewardKeys?: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: 'DISTANCE' | 'COINS' | 'RUNS' | 'JUMPS' | 'SLIDES' | 'EVASIONS' | 'HOVERBOARD' | 'HIGHSCORE';
  badgeIcon: string;
  tiers: TierConfig[];
}

export interface AchievementState {
  id: string;
  currentProgress: number;
  completedTiers: AchievementTier[];
  claimedTiers: AchievementTier[];
}

export interface SeasonMilestone {
  milestoneIndex: number;
  tokensRequired: number;
  rewardType: 'COINS' | 'HOVERBOARDS' | 'BOARD_SKIN' | 'CHARACTER_SKIN' | 'KEYS';
  rewardValue: number | string;
  rewardLabel: string;
  rewardIcon: string;
}

export interface SeasonPass {
  seasonId: string;
  seasonName: string;
  theme: string;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;   // ISO date YYYY-MM-DD
  tokensCollected: number;
  claimedMilestones: number[];
  milestones: SeasonMilestone[];
}

export type GameMode = 'BEGINNER' | 'EASY' | 'HARD' | 'NORMAL' | 'TIME_TRIAL' | 'COIN_RUSH' | 'SURVIVAL' | 'PRACTICE' | 'ARENA';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  tagline: string;
  icon: string;
  description: string;
  rules: string[];
  rewardDescription: string;
  targetGoal?: number;
}

export interface LifetimeStats {
  totalDistance: number;
  totalCoins: number;
  totalRuns: number;
  totalJumps: number;
  totalSlides: number;
  totalDodges: number;
  totalHoverboardsUsed: number;
  bestScore: number;
  hardModeHighScore: number;
  hardModeBestDistance: number;
  hardModeRuns: number;
  easyModeHighScore?: number;
  easyModeBestDistance?: number;
  easyModeRuns?: number;
  beginnerModeHighScore?: number;
  beginnerModeBestDistance?: number;
  beginnerModeRuns?: number;
  timeTrialHighScore: number;
  coinRushBestTime: number; // in seconds, lower is better
  survivalBestDistance: number;
}

export interface ProgressionState {
  version: number;
  currentMissionSet: number;
  activeMissions: Mission[];
  dailyDate: string;
  dailyChallenges: DailyChallenge[];
  achievements: Record<string, AchievementState>;
  seasonPass: SeasonPass;
  lifetimeStats: LifetimeStats;
  lastSelectedMode?: GameMode;
  unlockedCharacters: string[];
  selectedCharacter: string;
  unlockedOutfits: Record<string, string[]>; // characterId -> list of outfitIds
  selectedOutfits: Record<string, string>;   // characterId -> active outfitId
  unlockedBoards: string[];
  selectedBoard: string;
  hoverboardCharges: number;
  modiFreeRuns?: number;
  rahulTrialsRemaining?: number;
  rahulFreeRuns?: number;
  keys?: number;
  headstartBoosters?: number;
  scoreBoosters?: number;
}
