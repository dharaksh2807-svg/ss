import { EventBus, EVENTS } from '../core/EventBus';
import { UpgradeManager } from '../player/UpgradeManager';
import {
  Mission,
  DailyChallenge,
  AchievementDefinition,
  AchievementState,
  AchievementTier,
  SeasonPass,
  LifetimeStats,
  ProgressionState,
  GameMode
} from './ProgressionTypes';
import {
  MISSION_SETS,
  getMissionsForSet,
  generateDailyChallenges,
  ACHIEVEMENTS,
  DEFAULT_SEASON_PASS
} from './MissionCatalog';
import { getCharacterById, getOutfitById } from '../characters/CharacterCatalog';
import { getHoverboardById, HOVERBOARD_CHARGES_PACK } from '../hoverboard/HoverboardCatalog';

const STORAGE_KEY = 'metro_progression_v1';

export class ProgressionManager {
  private static instance: ProgressionManager;
  private state: ProgressionState;
  private eventBus = EventBus.getInstance();

  // Current single-run tracked stats
  private runActive: boolean = false;
  private runDistance: number = 0;
  private runCoins: number = 0;
  private runScore: number = 0;
  private runJumps: number = 0;
  private runSlides: number = 0;
  private runDodges: number = 0;
  private runNearMisses: number = 0;
  private runPowerups: number = 0;
  private activeGameMode: GameMode = 'NORMAL';

  private constructor() {
    this.state = this.loadState();
    if (this.state.lastSelectedMode) {
      this.activeGameMode = this.state.lastSelectedMode;
    }
    this.checkDailyReset();
    this.setupEventListeners();
  }

  public static getInstance(): ProgressionManager {
    if (!ProgressionManager.instance) {
      ProgressionManager.instance = new ProgressionManager();
    }
    return ProgressionManager.instance;
  }

  public load(): void {
    this.state = this.loadState();
  }

  public resetAll(): void {
    this.state = this.getDefaultState();
    this.saveState();
  }

  // --- Date & Daily Reset Helpers ---
  public getTodayLocalDateStr(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public getTimeUntilDailyReset(): { hours: number; minutes: number; seconds: number; formatted: string } {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return { hours, minutes, seconds, formatted };
  }

  public checkDailyReset(): void {
    const todayStr = this.getTodayLocalDateStr();
    if (this.state.dailyDate !== todayStr) {
      this.state.dailyDate = todayStr;
      this.state.dailyChallenges = generateDailyChallenges(todayStr);
      this.saveState();
    }
  }

  // --- State Persistence ---
  private getDefaultState(): ProgressionState {
    const todayStr = this.getTodayLocalDateStr();
    const achievementsMap: Record<string, AchievementState> = {};
    for (const def of ACHIEVEMENTS) {
      achievementsMap[def.id] = {
        id: def.id,
        currentProgress: 0,
        completedTiers: [],
        claimedTiers: []
      };
    }

    return {
      version: 1,
      currentMissionSet: 1,
      activeMissions: getMissionsForSet(1),
      dailyDate: todayStr,
      dailyChallenges: generateDailyChallenges(todayStr),
      achievements: achievementsMap,
      seasonPass: JSON.parse(JSON.stringify(DEFAULT_SEASON_PASS)),
      lifetimeStats: {
        totalDistance: 0,
        totalCoins: 0,
        totalRuns: 0,
        totalJumps: 0,
        totalSlides: 0,
        totalDodges: 0,
        totalHoverboardsUsed: 0,
        bestScore: 0,
        hardModeHighScore: 0,
        hardModeBestDistance: 0,
        hardModeRuns: 0,
        easyModeHighScore: 0,
        easyModeBestDistance: 0,
        easyModeRuns: 0,
        beginnerModeHighScore: 0,
        beginnerModeBestDistance: 0,
        beginnerModeRuns: 0,
        timeTrialHighScore: 0,
        coinRushBestTime: 0,
        survivalBestDistance: 0
      },
      lastSelectedMode: 'BEGINNER',
      unlockedCharacters: ['char_jax'],
      selectedCharacter: 'char_jax',
      unlockedOutfits: {
        char_jax: ['jax_classic'],
        char_luna: ['luna_neon'],
        char_cruz: ['cruz_bboy'],
        char_nova: ['nova_solar']
      },
      selectedOutfits: {
        char_jax: 'jax_classic',
        char_luna: 'luna_neon',
        char_cruz: 'cruz_bboy',
        char_nova: 'nova_solar'
      },
      unlockedBoards: ['board_urban_glide'],
      selectedBoard: 'board_urban_glide',
      hoverboardCharges: 5,
      modiFreeRuns: 5,
      rahulTrialsRemaining: 5,
      rahulFreeRuns: 5,
      keys: 3,
      headstartBoosters: 2,
      scoreBoosters: 2
    };
  }

  private loadState(): ProgressionState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Version migration: safely migrate unversioned legacy (v0) and v1 schemas
          const version = typeof parsed.version === 'number' ? parsed.version : 0;
          if (version <= 1) {
            parsed.version = 1;

            // Ensure lifetimeStats exists and backfills missing metrics
            const defStats = this.getDefaultState().lifetimeStats;
            parsed.lifetimeStats = {
              ...defStats,
              ...(parsed.lifetimeStats || {})
            };

            // Ensure activeMissions exist
            if (!Array.isArray(parsed.activeMissions) || parsed.activeMissions.length === 0) {
              parsed.activeMissions = getMissionsForSet(parsed.currentMissionSet || 1);
            }

            // Ensure dailyChallenges exist
            if (!Array.isArray(parsed.dailyChallenges) || parsed.dailyChallenges.length === 0) {
              parsed.dailyChallenges = generateDailyChallenges();
            }

            // Verify that all achievement keys exist in case new ones were added
            if (!parsed.achievements || typeof parsed.achievements !== 'object') {
              parsed.achievements = {};
            }
            for (const def of ACHIEVEMENTS) {
              if (!parsed.achievements[def.id]) {
                parsed.achievements[def.id] = {
                  id: def.id,
                  currentProgress: 0,
                  completedTiers: [],
                  claimedTiers: []
                };
              }
            }

            if (!parsed.seasonPass) {
              parsed.seasonPass = JSON.parse(JSON.stringify(DEFAULT_SEASON_PASS));
            }

            // Ensure characters and outfits exist
            if (!parsed.unlockedCharacters || parsed.unlockedCharacters.includes('char_default')) {
              parsed.unlockedCharacters = Array.from(new Set(['char_jax', ...(parsed.unlockedCharacters || [])]))
                .filter((id: string) => id !== 'char_default');
            }
            if (!parsed.selectedCharacter || parsed.selectedCharacter === 'char_default') {
              parsed.selectedCharacter = 'char_jax';
            }
            if (!parsed.unlockedOutfits) {
              parsed.unlockedOutfits = {
                char_jax: ['jax_classic'],
                char_luna: ['luna_neon'],
                char_cruz: ['cruz_bboy'],
                char_nova: ['nova_solar']
              };
            }
            if (!parsed.selectedOutfits) {
              parsed.selectedOutfits = {
                char_jax: 'jax_classic',
                char_luna: 'luna_neon',
                char_cruz: 'cruz_bboy',
                char_nova: 'nova_solar'
              };
            }
            if (parsed.modiFreeRuns === undefined) {
              parsed.modiFreeRuns = 5;
            }
            if (parsed.rahulTrialsRemaining === undefined) {
              parsed.rahulTrialsRemaining = parsed.rahulFreeRuns ?? 5;
            }
            if (parsed.rahulFreeRuns === undefined) {
              parsed.rahulFreeRuns = parsed.rahulTrialsRemaining;
            }
            if (!parsed.unlockedBoards || parsed.unlockedBoards.includes('board_default')) {
              parsed.unlockedBoards = Array.from(new Set(['board_urban_glide', ...(parsed.unlockedBoards || [])]))
                .filter((id: string) => id !== 'board_default');
            }
            if (!parsed.selectedBoard || parsed.selectedBoard === 'board_default') {
              parsed.selectedBoard = 'board_urban_glide';
            }
            if (parsed.hoverboardCharges === undefined) {
              parsed.hoverboardCharges = 5;
            }
            if (parsed.keys === undefined) {
              parsed.keys = 3;
            }
            if (parsed.headstartBoosters === undefined) {
              parsed.headstartBoosters = 2;
            }
            if (parsed.scoreBoosters === undefined) {
              parsed.scoreBoosters = 2;
            }
            if (parsed.currentMissionSet === undefined) {
              parsed.currentMissionSet = 1;
            }
            // Backward-compatible migration:
            // Old 'HARD' was the previous harder mode -> now 'EASY'.
            // Old 'NORMAL' was the previous easier mode -> now 'BEGINNER'.
            if (parsed.lifetimeStats) {
              if (parsed.lifetimeStats.hardModeHighScore !== undefined && parsed.lifetimeStats.easyModeHighScore === undefined) {
                parsed.lifetimeStats.easyModeHighScore = parsed.lifetimeStats.hardModeHighScore;
                parsed.lifetimeStats.easyModeBestDistance = parsed.lifetimeStats.hardModeBestDistance;
                parsed.lifetimeStats.easyModeRuns = parsed.lifetimeStats.hardModeRuns;
                if (parsed.lastSelectedMode === 'HARD') {
                  parsed.lastSelectedMode = 'EASY';
                }
              }
            }
            if (parsed.lastSelectedMode === 'NORMAL') {
              parsed.lastSelectedMode = 'BEGINNER';
            }
            if (!parsed.lastSelectedMode) {
              parsed.lastSelectedMode = 'BEGINNER';
            }
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse progression state, resetting to defaults', e);
    }
    return this.getDefaultState();
  }

  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save progression state to localStorage', e);
    }
  }

  public getState(): ProgressionState {
    return this.state;
  }

  public importState(newState: ProgressionState): void {
    const defaultState = this.getDefaultState();
    this.state = {
      ...defaultState,
      ...newState,
      lifetimeStats: {
        ...defaultState.lifetimeStats,
        ...(newState.lifetimeStats || {})
      },
      unlockedOutfits: {
        ...defaultState.unlockedOutfits,
        ...(newState.unlockedOutfits || {})
      },
      selectedOutfits: {
        ...defaultState.selectedOutfits,
        ...(newState.selectedOutfits || {})
      },
      achievements: {
        ...defaultState.achievements,
        ...(newState.achievements || {})
      }
    };

    if (!Array.isArray(this.state.activeMissions) || this.state.activeMissions.length === 0) {
      this.state.activeMissions = getMissionsForSet(this.state.currentMissionSet || 1);
    }
    if (!Array.isArray(this.state.dailyChallenges) || this.state.dailyChallenges.length === 0) {
      this.state.dailyChallenges = generateDailyChallenges(this.state.dailyDate);
    }

    this.saveState();
    this.eventBus.emit('PROGRESSION_RESTORED', this.state);
    this.eventBus.emit('KEYS_UPDATED', this.state.keys ?? 3);
    this.eventBus.emit('WALLET_UPDATED', this.state.lifetimeStats?.totalCoins ?? 0);
  }

  public getActiveMissions(): Mission[] {
    return this.state.activeMissions;
  }

  public getDailyChallenges(): DailyChallenge[] {
    return this.state.dailyChallenges;
  }

  public getAchievementsList(): { def: AchievementDefinition; state: AchievementState }[] {
    return ACHIEVEMENTS.map(def => ({
      def,
      state: this.state.achievements[def.id] || {
        id: def.id,
        currentProgress: 0,
        completedTiers: [],
        claimedTiers: []
      }
    }));
  }

  public getActiveGameMode(): GameMode {
    return this.activeGameMode;
  }

  public setActiveGameMode(mode: GameMode): void {
    this.activeGameMode = mode;
    this.state.lastSelectedMode = mode;
    this.saveState();
  }

  public getLastSelectedMode(): GameMode {
    return this.state.lastSelectedMode || 'NORMAL';
  }

  // --- Central Event Listeners ---
  private isProgressionEligible(): boolean {
    return this.activeGameMode !== 'PRACTICE' && this.activeGameMode !== 'ARENA';
  }

  private setupEventListeners(): void {
    this.eventBus.on(EVENTS.RUN_STARTED, () => {
      if (!this.isProgressionEligible()) return;
      this.onRunStarted();
    });
    this.eventBus.on(EVENTS.GAME_START, () => {
      if (!this.isProgressionEligible()) return;
      this.onRunStarted();
    });

    this.eventBus.on(EVENTS.RUN_FINISHED, () => {
      if (!this.isProgressionEligible()) return;
      this.onRunFinished();
    });
    this.eventBus.on(EVENTS.GAME_OVER, () => {
      if (!this.isProgressionEligible()) return;
      this.onRunFinished();
    });

    this.eventBus.on(EVENTS.COIN_COLLECTED, () => {
      if (!this.isProgressionEligible()) return;
      this.onCoinCollected();
    });
    this.eventBus.on(EVENTS.DISTANCE_TRAVELED, (meters: number) => {
      if (!this.isProgressionEligible()) return;
      this.onDistanceTraveled(meters);
    });
    this.eventBus.on(EVENTS.JUMP_COMPLETED, () => {
      if (!this.isProgressionEligible()) return;
      this.onJumpCompleted();
    });
    this.eventBus.on(EVENTS.SLIDE_COMPLETED, () => {
      if (!this.isProgressionEligible()) return;
      this.onSlideCompleted();
    });
    this.eventBus.on(EVENTS.POWERUP_ACTIVATED, (type: string) => {
      if (!this.isProgressionEligible()) return;
      this.onPowerupActivated(type);
    });
    this.eventBus.on(EVENTS.OBSTACLE_DODGED, (type: string) => {
      if (!this.isProgressionEligible()) return;
      this.onObstacleDodged(type);
    });
    this.eventBus.on(EVENTS.NEAR_MISS, () => {
      if (!this.isProgressionEligible()) return;
      this.onNearMiss();
    });
    this.eventBus.on(EVENTS.BOARD_ACTIVATED, () => {
      if (!this.isProgressionEligible()) return;
      this.onBoardActivated();
    });
    this.eventBus.on(EVENTS.HOVERBOARD_ACTIVATED, () => {
      if (!this.isProgressionEligible()) return;
      this.onBoardActivated();
    });
    this.eventBus.on(EVENTS.SCORE_UPDATED, (score: number) => {
      if (!this.isProgressionEligible()) return;
      this.onScoreUpdated(score);
    });
    this.eventBus.on(EVENTS.SEASON_TOKEN_COLLECTED, (count: number = 1) => {
      if (!this.isProgressionEligible()) return;
      this.onSeasonTokenCollected(count);
    });
  }

  private onRunStarted(): void {
    if (this.runActive) return;
    this.runActive = true;
    this.runDistance = 0;
    this.runCoins = 0;
    this.runScore = 0;
    this.runJumps = 0;
    this.runSlides = 0;
    this.runDodges = 0;
    this.runNearMisses = 0;
    this.runPowerups = 0;

    // Reset single-run progress for active missions that require single run
    for (const mission of this.state.activeMissions) {
      if (mission.inSingleRun && !mission.completed) {
        mission.progress = 0;
      }
    }

    this.state.lifetimeStats.totalRuns++;
    this.updateAchievement('ach_runs', this.state.lifetimeStats.totalRuns);

    // Free trial run deduction for Rahul Gandhi when gameplay starts while not permanently owned
    const selectedChar = this.normalizeCharacterId(this.state.selectedCharacter);
    if (selectedChar === 'char_rahul_gandhi' && !this.isCharacterUnlocked('char_rahul_gandhi')) {
      const current = this.getRahulTrialsRemaining();
      const remaining = Math.max(0, current - 1);
      this.state.rahulTrialsRemaining = remaining;
      this.state.rahulFreeRuns = remaining;
    }

    this.saveState();
  }

  private onRunFinished(): void {
    if (!this.runActive) return;
    this.runActive = false;

    if (this.activeGameMode === 'HARD') {
      this.state.lifetimeStats.hardModeRuns = (this.state.lifetimeStats.hardModeRuns || 0) + 1;
      if (this.runScore > (this.state.lifetimeStats.hardModeHighScore || 0)) {
        this.state.lifetimeStats.hardModeHighScore = Math.floor(this.runScore);
      }
      if (this.runDistance > (this.state.lifetimeStats.hardModeBestDistance || 0)) {
        this.state.lifetimeStats.hardModeBestDistance = Math.floor(this.runDistance);
      }
      this.updateAchievement('ach_hard_score', this.state.lifetimeStats.hardModeHighScore);
      this.updateAchievement('ach_hard_distance', this.state.lifetimeStats.hardModeBestDistance);
    } else if (this.activeGameMode === 'EASY') {
      this.state.lifetimeStats.easyModeRuns = (this.state.lifetimeStats.easyModeRuns || 0) + 1;
      if (this.runScore > (this.state.lifetimeStats.easyModeHighScore || 0)) {
        this.state.lifetimeStats.easyModeHighScore = Math.floor(this.runScore);
      }
      if (this.runDistance > (this.state.lifetimeStats.easyModeBestDistance || 0)) {
        this.state.lifetimeStats.easyModeBestDistance = Math.floor(this.runDistance);
      }
    } else {
      // BEGINNER / NORMAL
      this.state.lifetimeStats.beginnerModeRuns = (this.state.lifetimeStats.beginnerModeRuns || 0) + 1;
      if (this.runScore > (this.state.lifetimeStats.beginnerModeHighScore || 0)) {
        this.state.lifetimeStats.beginnerModeHighScore = Math.floor(this.runScore);
      }
      if (this.runDistance > (this.state.lifetimeStats.beginnerModeBestDistance || 0)) {
        this.state.lifetimeStats.beginnerModeBestDistance = Math.floor(this.runDistance);
      }
      if (this.runScore > this.state.lifetimeStats.bestScore) {
        this.state.lifetimeStats.bestScore = Math.floor(this.runScore);
        this.updateAchievement('ach_highscore', this.state.lifetimeStats.bestScore);
      }
    }

    if (this.activeGameMode === 'TIME_TRIAL' && this.runScore > this.state.lifetimeStats.timeTrialHighScore) {
      this.state.lifetimeStats.timeTrialHighScore = Math.floor(this.runScore);
    }

    if (this.activeGameMode === 'SURVIVAL' && this.runDistance > this.state.lifetimeStats.survivalBestDistance) {
      this.state.lifetimeStats.survivalBestDistance = Math.floor(this.runDistance);
    }

    // Free trial run deduction for Narendra Modi if not permanently owned
    if (this.state.selectedCharacter === 'char_modi' && !this.isCharacterUnlocked('char_modi')) {
      const current = this.state.modiFreeRuns ?? 5;
      const remaining = Math.max(0, current - 1);
      this.state.modiFreeRuns = remaining;
      if (remaining === 0) {
        this.state.selectedCharacter = 'char_jax';
        this.eventBus.emit('CHARACTER_EQUIPPED', { charId: 'char_jax', outfitId: 'jax_classic' });
      }
    }

    // Revert selection for Rahul Gandhi if all trials are exhausted and not permanently owned
    const finishedChar = this.normalizeCharacterId(this.state.selectedCharacter);
    if (finishedChar === 'char_rahul_gandhi' && !this.isCharacterUnlocked('char_rahul_gandhi')) {
      if (this.getRahulTrialsRemaining() <= 0) {
        this.state.selectedCharacter = 'char_jax';
        this.eventBus.emit('CHARACTER_EQUIPPED', { charId: 'char_jax', outfitId: 'jax_classic' });
      }
    }

    this.saveState();
  }

  private onCoinCollected(): void {
    this.runCoins++;
    this.state.lifetimeStats.totalCoins++;

    // Missions
    this.advanceMissions('COINS', 1);

    // Daily Challenge
    this.advanceDaily('DAILY_COIN', 1);

    // Lifetime Achievement
    this.updateAchievement('ach_coins', this.state.lifetimeStats.totalCoins);

    // Game mode check (Coin Rush)
    if (this.activeGameMode === 'COIN_RUSH' && this.runCoins >= 150) {
      this.eventBus.emit(EVENTS.MODE_OBJECTIVE_REACHED, 'COIN_RUSH');
    }

    this.saveState();
  }

  private onDistanceTraveled(meters: number): void {
    if (meters <= 0) return;
    this.runDistance += meters;
    this.state.lifetimeStats.totalDistance += meters;

    this.advanceMissions('DISTANCE', meters);
    this.advanceDaily('DAILY_DISTANCE', meters);
    this.updateAchievement('ach_distance', Math.floor(this.state.lifetimeStats.totalDistance));

    if (this.activeGameMode === 'HARD') {
      if (this.runDistance > (this.state.lifetimeStats.hardModeBestDistance || 0)) {
        this.state.lifetimeStats.hardModeBestDistance = Math.floor(this.runDistance);
        this.updateAchievement('ach_hard_distance', this.state.lifetimeStats.hardModeBestDistance);
      }
    } else if (this.activeGameMode === 'SURVIVAL') {
      if (this.runDistance > this.state.lifetimeStats.survivalBestDistance) {
        this.state.lifetimeStats.survivalBestDistance = Math.floor(this.runDistance);
      }
    }

    this.saveState();
  }

  private onJumpCompleted(): void {
    this.runJumps++;
    this.state.lifetimeStats.totalJumps++;

    this.advanceMissions('JUMPS', 1);
    this.advanceDaily('DAILY_ACTION', 1);
    this.updateAchievement('ach_jumps', this.state.lifetimeStats.totalJumps);

    this.saveState();
  }

  private onSlideCompleted(): void {
    this.runSlides++;
    this.state.lifetimeStats.totalSlides++;

    this.advanceMissions('SLIDES', 1);
    this.advanceDaily('DAILY_ACTION', 1);
    this.updateAchievement('ach_slides', this.state.lifetimeStats.totalSlides);

    this.saveState();
  }

  private onPowerupActivated(_type: string): void {
    this.runPowerups++;
    this.advanceMissions('POWERUPS', 1);
    this.advanceDaily('DAILY_SPECIAL', 1);
    this.saveState();
  }

  private onObstacleDodged(_type: string): void {
    this.runDodges++;
    this.state.lifetimeStats.totalDodges++;

    this.advanceMissions('OBSTACLES', 1);
    this.updateAchievement('ach_dodges', this.state.lifetimeStats.totalDodges);

    this.saveState();
  }

  private onNearMiss(): void {
    this.runNearMisses++;
    this.advanceMissions('NEAR_MISS', 1);
    this.advanceDaily('DAILY_SPECIAL', 1);
    this.saveState();
  }

  private onBoardActivated(): void {
    this.state.lifetimeStats.totalHoverboardsUsed++;
    this.updateAchievement('ach_hoverboards', this.state.lifetimeStats.totalHoverboardsUsed);
    this.saveState();
  }

  private onScoreUpdated(score: number): void {
    this.runScore = score;

    for (const mission of this.state.activeMissions) {
      if (mission.type === 'SCORE' && !mission.completed) {
        mission.progress = Math.floor(this.runScore);
        if (mission.progress >= mission.target) {
          mission.progress = mission.target;
          mission.completed = true;
          this.eventBus.emit(EVENTS.MISSION_COMPLETED, mission);
        }
      }
    }

    this.advanceDaily('DAILY_SCORE', score, true);

    if (this.runScore > this.state.lifetimeStats.bestScore) {
      this.state.lifetimeStats.bestScore = Math.floor(this.runScore);
      this.updateAchievement('ach_highscore', this.state.lifetimeStats.bestScore);
    }
  }

  private onSeasonTokenCollected(count: number = 1): void {
    this.state.seasonPass.tokensCollected += count;
    this.saveState();
  }

  // --- Increment Engines ---
  private advanceMissions(type: string, amount: number): void {
    for (const mission of this.state.activeMissions) {
      if (mission.type === type && !mission.completed) {
        mission.progress = Math.min(mission.target, mission.progress + amount);
        if (mission.progress >= mission.target) {
          mission.completed = true;
          this.eventBus.emit(EVENTS.MISSION_COMPLETED, mission);
        }
      }
    }
  }

  private advanceDaily(type: string, amount: number, absolute: boolean = false): void {
    this.checkDailyReset();
    for (const challenge of this.state.dailyChallenges) {
      if (challenge.type === type && !challenge.completed) {
        if (absolute) {
          challenge.progress = Math.min(challenge.target, Math.floor(amount));
        } else {
          challenge.progress = Math.min(challenge.target, challenge.progress + amount);
        }
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
          this.eventBus.emit(EVENTS.DAILY_COMPLETED, challenge);
        }
      }
    }
  }

  private updateAchievement(achId: string, currentVal: number): void {
    const achState = this.state.achievements[achId];
    const def = ACHIEVEMENTS.find(a => a.id === achId);
    if (!achState || !def) return;

    achState.currentProgress = currentVal;
    for (const tierConfig of def.tiers) {
      if (currentVal >= tierConfig.target && !achState.completedTiers.includes(tierConfig.tier)) {
        achState.completedTiers.push(tierConfig.tier);
        this.eventBus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, {
          achievement: def,
          tier: tierConfig.tier,
          rewardCoins: tierConfig.rewardCoins
        });
      }
    }
  }

  // --- Safe Claiming with Duplicate Prevention ---
  public claimMissionReward(missionId: string): { success: boolean; coinsGranted: number; advancedSet: boolean } {
    const mission = this.state.activeMissions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) {
      return { success: false, coinsGranted: 0, advancedSet: false };
    }

    mission.claimed = true;
    const coins = mission.rewardCoins;
    UpgradeManager.getInstance().addCoins(coins);

    // Check if all 3 missions in set are claimed -> Advance to next set!
    let advancedSet = false;
    const allClaimed = this.state.activeMissions.every(m => m.claimed);
    if (allClaimed) {
      this.state.currentMissionSet++;
      this.state.activeMissions = getMissionsForSet(this.state.currentMissionSet);
      this.addKeys(1); // Set completion bonus key
      advancedSet = true;
    }

    this.saveState();
    return { success: true, coinsGranted: coins, advancedSet };
  }

  public claimDailyReward(challengeId: string): { success: boolean; coinsGranted: number } {
    this.checkDailyReset();
    const challenge = this.state.dailyChallenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.completed || challenge.claimed) {
      return { success: false, coinsGranted: 0 };
    }

    challenge.claimed = true;
    const coins = challenge.rewardCoins;
    UpgradeManager.getInstance().addCoins(coins);

    this.saveState();
    return { success: true, coinsGranted: coins };
  }

  public claimAchievementReward(achId: string, tier: AchievementTier): { success: boolean; coinsGranted: number; keysGranted?: number } {
    const achState = this.state.achievements[achId];
    const def = ACHIEVEMENTS.find(a => a.id === achId);
    if (!achState || !def) return { success: false, coinsGranted: 0 };

    if (!achState.completedTiers.includes(tier) || achState.claimedTiers.includes(tier)) {
      return { success: false, coinsGranted: 0 };
    }

    achState.claimedTiers.push(tier);
    const tierConfig = def.tiers.find(t => t.tier === tier);
    const coins = tierConfig ? tierConfig.rewardCoins : 0;
    if (coins > 0) {
      UpgradeManager.getInstance().addCoins(coins);
    }
    const keys = tierConfig?.rewardKeys ?? 0;
    if (keys > 0) {
      this.addKeys(keys);
    }

    this.saveState();
    return { success: true, coinsGranted: coins, keysGranted: keys };
  }

  public claimSeasonMilestone(milestoneIndex: number): { success: boolean; message: string } {
    const pass = this.state.seasonPass;
    const milestone = pass.milestones.find(m => m.milestoneIndex === milestoneIndex);
    if (!milestone) return { success: false, message: 'Invalid milestone' };

    if (pass.tokensCollected < milestone.tokensRequired) {
      return { success: false, message: 'Not enough seasonal tokens' };
    }

    if (pass.claimedMilestones.includes(milestoneIndex)) {
      return { success: false, message: 'Milestone already claimed' };
    }

    pass.claimedMilestones.push(milestoneIndex);

    // Grant reward safely
    if (milestone.rewardType === 'COINS') {
      UpgradeManager.getInstance().addCoins(Number(milestone.rewardValue));
    } else if (milestone.rewardType === 'HOVERBOARDS') {
      this.addHoverboardCharges(Number(milestone.rewardValue));
    } else if (milestone.rewardType === 'KEYS') {
      this.addKeys(Number(milestone.rewardValue));
    } else if (milestone.rewardType === 'BOARD_SKIN') {
      if (!this.state.unlockedBoards.includes(String(milestone.rewardValue))) {
        this.state.unlockedBoards.push(String(milestone.rewardValue));
      }
    } else if (milestone.rewardType === 'CHARACTER_SKIN') {
      if (!this.state.unlockedCharacters.includes(String(milestone.rewardValue))) {
        this.state.unlockedCharacters.push(String(milestone.rewardValue));
      }
    }

    this.saveState();
    return { success: true, message: `Claimed ${milestone.rewardLabel}!` };
  }

  // Getters for Single-Run live stats
  public getRunStats() {
    return {
      distance: this.runDistance,
      coins: this.runCoins,
      score: this.runScore,
      jumps: this.runJumps,
      slides: this.runSlides,
      dodges: this.runDodges,
      nearMisses: this.runNearMisses,
      powerups: this.runPowerups
    };
  }

  public getLifetimeStats(): LifetimeStats {
    return { ...this.state.lifetimeStats };
  }

  // --- Character & Outfit Collection Management ---

  public getUnlockedCharacters(): string[] {
    return [...this.state.unlockedCharacters];
  }

  public getSelectedCharacter(): string {
    return this.state.selectedCharacter || 'char_jax';
  }

  public normalizeCharacterId(charId: string): string {
    if (!charId) return 'char_jax';
    if (charId === 'rahul_gandhi' || charId === 'char_rahul_gandhi') return 'char_rahul_gandhi';
    if (charId === 'modi' || charId === 'char_modi') return 'char_modi';
    return charId;
  }

  public isCharacterUnlocked(charId: string): boolean {
    const norm = this.normalizeCharacterId(charId);
    if (norm === 'char_jax') return true;
    return this.state.unlockedCharacters.includes(norm) || this.state.unlockedCharacters.includes(charId);
  }

  public unlockCharacter(charId: string): boolean {
    const norm = this.normalizeCharacterId(charId);
    let changed = false;
    if (!this.state.unlockedCharacters.includes(norm)) {
      this.state.unlockedCharacters.push(norm);
      changed = true;
    }
    if (charId !== norm && !this.state.unlockedCharacters.includes(charId)) {
      this.state.unlockedCharacters.push(charId);
      changed = true;
    }

    if (changed) {
      // Auto-unlock default outfit for this character
      const charDef = getCharacterById(norm);
      if (charDef) {
        if (!this.state.unlockedOutfits[norm]) {
          this.state.unlockedOutfits[norm] = [];
        }
        if (!this.state.unlockedOutfits[norm].includes(charDef.defaultOutfitId)) {
          this.state.unlockedOutfits[norm].push(charDef.defaultOutfitId);
        }
        this.state.selectedOutfits[norm] = charDef.defaultOutfitId;
      }
      this.saveState();
      this.eventBus.emit('CHARACTER_UNLOCKED', norm);
      return true;
    }
    return false;
  }

  public getUnlockedOutfits(charId: string): string[] {
    const norm = this.normalizeCharacterId(charId);
    const list = this.state.unlockedOutfits[norm];
    if (!list || list.length === 0) {
      const charDef = getCharacterById(norm);
      return charDef ? [charDef.defaultOutfitId] : ['jax_classic'];
    }
    return [...list];
  }

  public getSelectedOutfit(charId: string): string {
    const norm = this.normalizeCharacterId(charId);
    if (this.state.selectedOutfits[norm]) {
      return this.state.selectedOutfits[norm];
    }
    const charDef = getCharacterById(norm);
    return charDef ? charDef.defaultOutfitId : 'jax_classic';
  }

  public isOutfitUnlocked(charId: string, outfitId: string): boolean {
    const norm = this.normalizeCharacterId(charId);
    const charDef = getCharacterById(norm);
    if (charDef && charDef.defaultOutfitId === outfitId) {
      return this.isCharacterUnlocked(norm);
    }
    const list = this.state.unlockedOutfits[norm] || [];
    return list.includes(outfitId);
  }

  public unlockOutfit(charId: string, outfitId: string): boolean {
    const norm = this.normalizeCharacterId(charId);
    if (!this.state.unlockedOutfits[norm]) {
      this.state.unlockedOutfits[norm] = [];
    }
    if (!this.state.unlockedOutfits[norm].includes(outfitId)) {
      this.state.unlockedOutfits[norm].push(outfitId);
      this.saveState();
      this.eventBus.emit('OUTFIT_UNLOCKED', { charId: norm, outfitId });
      return true;
    }
    return false;
  }

  public getModiFreeRuns(): number {
    return this.state.modiFreeRuns ?? 5;
  }

  public setModiFreeRuns(count: number): void {
    this.state.modiFreeRuns = Math.max(0, count);
    this.saveState();
  }

  public getRahulTrialsRemaining(): number {
    return this.state.rahulTrialsRemaining ?? 5;
  }

  public getRahulFreeRuns(): number {
    return this.getRahulTrialsRemaining();
  }

  public setRahulTrialsRemaining(count: number): void {
    const clamped = Math.max(0, count);
    this.state.rahulTrialsRemaining = clamped;
    this.state.rahulFreeRuns = clamped;
    this.saveState();
  }

  public setRahulFreeRuns(count: number): void {
    this.setRahulTrialsRemaining(count);
  }

  public getCharacterFreeRuns(charId: string): number {
    const norm = this.normalizeCharacterId(charId);
    if (norm === 'char_modi') {
      return this.getModiFreeRuns();
    }
    if (norm === 'char_rahul_gandhi') {
      return this.getRahulTrialsRemaining();
    }
    return 0;
  }

  public equipCharacter(charId: string, outfitId?: string): { success: boolean; message: string } {
    const norm = this.normalizeCharacterId(charId);
    const isUnlocked = this.isCharacterUnlocked(norm);
    const freeRuns = this.getCharacterFreeRuns(norm);
    const hasFreeRuns = freeRuns > 0;
    if (!isUnlocked && !hasFreeRuns) {
      return { success: false, message: 'Character is locked' };
    }

    const charDef = getCharacterById(norm);
    if (!charDef) {
      return { success: false, message: 'Character not found' };
    }

    const targetOutfit = outfitId || this.getSelectedOutfit(norm) || charDef.defaultOutfitId;
    if (!isUnlocked && hasFreeRuns) {
      this.state.selectedCharacter = norm;
      if (!this.state.selectedOutfits) this.state.selectedOutfits = {};
      this.state.selectedOutfits[norm] = targetOutfit;
      this.saveState();

      this.eventBus.emit('CHARACTER_EQUIPPED', { charId: norm, outfitId: targetOutfit });
      return { success: true, message: `Equipped ${charDef.name}! (${freeRuns} free runs remaining)` };
    }

    if (!this.isOutfitUnlocked(norm, targetOutfit)) {
      return { success: false, message: 'Outfit is locked' };
    }

    this.state.selectedCharacter = norm;
    this.state.selectedOutfits[norm] = targetOutfit;
    this.saveState();

    this.eventBus.emit('CHARACTER_EQUIPPED', { charId: norm, outfitId: targetOutfit });
    return { success: true, message: `Equipped ${charDef.name}!` };
  }

  public purchaseCharacter(charId: string): { success: boolean; message: string } {
    const norm = this.normalizeCharacterId(charId);
    if (this.isCharacterUnlocked(norm)) {
      return { success: false, message: 'Character already owned' };
    }

    const charDef = getCharacterById(norm);
    if (!charDef) {
      return { success: false, message: 'Character not found' };
    }

    if (charDef.unlock.type === 'FREE') {
      this.unlockCharacter(norm);
      this.equipCharacter(norm);
      return { success: true, message: `Unlocked ${charDef.name}!` };
    }

    if (charDef.unlock.type === 'COINS') {
      const cost = charDef.unlock.cost || 0;
      const upgradeMgr = UpgradeManager.getInstance();
      if (upgradeMgr.getCoins() < cost) {
        return { success: false, message: `Insufficient coins (Requires ${cost.toLocaleString()} 🪙)` };
      }

      // Single deduction exactly once
      const deducted = upgradeMgr.deductCoins(cost);
      if (!deducted) {
        return { success: false, message: 'Transaction failed' };
      }

      this.unlockCharacter(norm);
      this.equipCharacter(norm);
      return { success: true, message: `Purchased and equipped ${charDef.name}!` };
    }

    return { success: false, message: `Cannot purchase: ${charDef.unlock.description}` };
  }

  public purchaseOutfit(charId: string, outfitId: string): { success: boolean; message: string } {
    if (this.isOutfitUnlocked(charId, outfitId)) {
      return { success: false, message: 'Outfit already owned' };
    }

    const outfit = getOutfitById(charId, outfitId);
    if (!outfit) {
      return { success: false, message: 'Outfit not found' };
    }

    if (outfit.unlock.type === 'FREE') {
      this.unlockOutfit(charId, outfitId);
      this.equipCharacter(charId, outfitId);
      return { success: true, message: `Unlocked ${outfit.name}!` };
    }

    if (outfit.unlock.type === 'COINS') {
      const cost = outfit.unlock.cost || 0;
      const upgradeMgr = UpgradeManager.getInstance();
      if (upgradeMgr.getCoins() < cost) {
        return { success: false, message: `Insufficient coins (Requires ${cost.toLocaleString()} 🪙)` };
      }

      // Single deduction exactly once
      const deducted = upgradeMgr.deductCoins(cost);
      if (!deducted) {
        return { success: false, message: 'Transaction failed' };
      }

      this.unlockOutfit(charId, outfitId);
      this.equipCharacter(charId, outfitId);
      return { success: true, message: `Purchased and equipped ${outfit.name}!` };
    }

    return { success: false, message: `Cannot purchase: ${outfit.unlock.description}` };
  }

  // --- Hoverboard Collection & Charges ---

  public getUnlockedBoards(): string[] {
    return [...this.state.unlockedBoards];
  }

  public getSelectedBoard(): string {
    return this.state.selectedBoard || 'board_urban_glide';
  }

  public isBoardUnlocked(boardId: string): boolean {
    return this.state.unlockedBoards.includes(boardId);
  }

  public unlockBoard(boardId: string): void {
    if (!this.state.unlockedBoards.includes(boardId)) {
      this.state.unlockedBoards.push(boardId);
      this.saveState();
      this.eventBus.emit('BOARD_UNLOCKED', boardId);
    }
  }

  public equipBoard(boardId: string): { success: boolean; message: string } {
    if (!this.isBoardUnlocked(boardId)) {
      return { success: false, message: 'Hoverboard not unlocked yet' };
    }

    const def = getHoverboardById(boardId);
    if (!def) {
      return { success: false, message: 'Hoverboard not found' };
    }

    this.state.selectedBoard = boardId;
    this.saveState();

    this.eventBus.emit('BOARD_EQUIPPED', boardId);
    return { success: true, message: `Equipped ${def.name}!` };
  }

  public purchaseBoard(boardId: string): { success: boolean; message: string } {
    if (this.isBoardUnlocked(boardId)) {
      return { success: false, message: 'Hoverboard already owned' };
    }

    const def = getHoverboardById(boardId);
    if (!def) {
      return { success: false, message: 'Hoverboard not found' };
    }

    if (def.unlock.type === 'FREE') {
      this.unlockBoard(boardId);
      this.equipBoard(boardId);
      return { success: true, message: `Unlocked ${def.name}!` };
    }

    if (def.unlock.type === 'COINS') {
      const cost = def.unlock.cost || 0;
      const upgradeMgr = UpgradeManager.getInstance();
      if (upgradeMgr.getCoins() < cost) {
        return { success: false, message: `Insufficient coins (Requires ${cost.toLocaleString()} 🪙)` };
      }

      // Single deduction exactly once
      const deducted = upgradeMgr.deductCoins(cost);
      if (!deducted) {
        return { success: false, message: 'Transaction failed' };
      }

      this.unlockBoard(boardId);
      this.equipBoard(boardId);
      return { success: true, message: `Purchased and equipped ${def.name}!` };
    }

    return { success: false, message: `Cannot purchase: ${def.unlock.description}` };
  }

  public getHoverboardCharges(): number {
    return this.state.hoverboardCharges ?? 5;
  }

  public addHoverboardCharges(count: number): void {
    this.state.hoverboardCharges = (this.state.hoverboardCharges ?? 0) + count;
    this.saveState();
    this.eventBus.emit('BOARD_CHARGES_UPDATED', this.state.hoverboardCharges);
  }

  public consumeHoverboardCharge(): boolean {
    if ((this.state.hoverboardCharges ?? 0) > 0) {
      this.state.hoverboardCharges!--;
      this.saveState();
      this.eventBus.emit('BOARD_CHARGES_UPDATED', this.state.hoverboardCharges);
      return true;
    }
    return false;
  }

  public getKeys(): number {
    return this.state.keys ?? 3;
  }

  public addKeys(count: number): void {
    if (count <= 0) return;
    this.state.keys = Math.max(0, (this.state.keys ?? 0) + count);
    this.saveState();
    this.eventBus.emit('KEYS_UPDATED', this.state.keys);
  }

  public consumeKeys(count: number): boolean {
    if (count <= 0) return true;
    const current = this.state.keys ?? 0;
    if (current < count) return false;
    this.state.keys = current - count;
    this.saveState();
    this.eventBus.emit('KEYS_UPDATED', this.state.keys);
    return true;
  }

  public purchaseHoverboardCharges(): { success: boolean; message: string } {
    const cost = HOVERBOARD_CHARGES_PACK.cost;
    const upgradeMgr = UpgradeManager.getInstance();
    if (upgradeMgr.getCoins() < cost) {
      return { success: false, message: `Insufficient coins (Requires ${cost.toLocaleString()} 🪙)` };
    }

    const deducted = upgradeMgr.deductCoins(cost);
    if (!deducted) {
      return { success: false, message: 'Transaction failed' };
    }

    this.addHoverboardCharges(HOVERBOARD_CHARGES_PACK.count);
    return {
      success: true,
      message: `Purchased +${HOVERBOARD_CHARGES_PACK.count} Hoverboards!`
    };
  }

  public recordHoverboardUsed(): void {
    this.state.lifetimeStats.totalHoverboardsUsed++;
    this.saveState();
    this.updateAchievement('ach_hoverboards', this.state.lifetimeStats.totalHoverboardsUsed);
  }

  // --- Consumable Boosters Economy ---

  public getHeadstartCount(): number {
    return this.state.headstartBoosters ?? 2;
  }

  public getScoreBoosterCount(): number {
    return this.state.scoreBoosters ?? 2;
  }

  public consumeHeadstart(): boolean {
    if ((this.state.headstartBoosters ?? 0) > 0) {
      this.state.headstartBoosters!--;
      this.saveState();
      this.eventBus.emit('BOOSTERS_UPDATED');
      return true;
    }
    return false;
  }

  public consumeScoreBooster(): boolean {
    if ((this.state.scoreBoosters ?? 0) > 0) {
      this.state.scoreBoosters!--;
      this.saveState();
      this.eventBus.emit('BOOSTERS_UPDATED');
      return true;
    }
    return false;
  }

  public purchaseHeadstart(count: number = 1): { success: boolean; message: string } {
    const cost = 400 * count;
    const upgradeMgr = UpgradeManager.getInstance();
    if (upgradeMgr.getCoins() < cost) {
      return { success: false, message: `Insufficient coins (Requires ${cost.toLocaleString()} 🪙)` };
    }
    if (!upgradeMgr.deductCoins(cost)) {
      return { success: false, message: 'Transaction failed' };
    }
    this.state.headstartBoosters = (this.state.headstartBoosters ?? 0) + count;
    this.saveState();
    this.eventBus.emit('BOOSTERS_UPDATED');
    return { success: true, message: `Purchased +${count} Headstart Booster!` };
  }

  public purchaseScoreBooster(count: number = 1): { success: boolean; message: string } {
    const cost = 500 * count;
    const upgradeMgr = UpgradeManager.getInstance();
    if (upgradeMgr.getCoins() < cost) {
      return { success: false, message: `Insufficient coins (Requires ${cost.toLocaleString()} 🪙)` };
    }
    if (!upgradeMgr.deductCoins(cost)) {
      return { success: false, message: 'Transaction failed' };
    }
    this.state.scoreBoosters = (this.state.scoreBoosters ?? 0) + count;
    this.saveState();
    this.eventBus.emit('BOOSTERS_UPDATED');
    return { success: true, message: `Purchased +${count} Score Booster!` };
  }

  public purchaseBoardMegapack(): { success: boolean; message: string } {
    const cost = 850; // Discounted pack of 10 (saves 150 coins!)
    const upgradeMgr = UpgradeManager.getInstance();
    if (upgradeMgr.getCoins() < cost) {
      return { success: false, message: `Insufficient coins (Requires ${cost.toLocaleString()} 🪙)` };
    }
    if (!upgradeMgr.deductCoins(cost)) {
      return { success: false, message: 'Transaction failed' };
    }
    this.addHoverboardCharges(10);
    return { success: true, message: `Purchased +10 Hoverboard Megapack!` };
  }
}

