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
    this.checkDailyReset();
    this.setupEventListeners();
  }

  public static getInstance(): ProgressionManager {
    if (!ProgressionManager.instance) {
      ProgressionManager.instance = new ProgressionManager();
    }
    return ProgressionManager.instance;
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
        timeTrialHighScore: 0,
        coinRushBestTime: 0,
        survivalBestDistance: 0
      },
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
      hoverboardCharges: 5
    };
  }

  private loadState(): ProgressionState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === 1) {
          // Verify that all achievement keys exist in case new ones were added
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
              .filter((id) => id !== 'char_default');
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
          return parsed;
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

  public getActiveGameMode(): GameMode {
    return this.activeGameMode;
  }

  public setActiveGameMode(mode: GameMode): void {
    this.activeGameMode = mode;
  }

  // --- Central Event Listeners ---
  private setupEventListeners(): void {
    this.eventBus.on(EVENTS.RUN_STARTED, () => this.onRunStarted());
    this.eventBus.on(EVENTS.GAME_START, () => this.onRunStarted());

    this.eventBus.on(EVENTS.RUN_FINISHED, () => this.onRunFinished());
    this.eventBus.on(EVENTS.GAME_OVER, () => this.onRunFinished());

    this.eventBus.on(EVENTS.COIN_COLLECTED, () => this.onCoinCollected());
    this.eventBus.on(EVENTS.DISTANCE_TRAVELED, (meters: number) => this.onDistanceTraveled(meters));
    this.eventBus.on(EVENTS.JUMP_COMPLETED, () => this.onJumpCompleted());
    this.eventBus.on(EVENTS.SLIDE_COMPLETED, () => this.onSlideCompleted());
    this.eventBus.on(EVENTS.POWERUP_ACTIVATED, (type: string) => this.onPowerupActivated(type));
    this.eventBus.on(EVENTS.OBSTACLE_DODGED, (type: string) => this.onObstacleDodged(type));
    this.eventBus.on(EVENTS.NEAR_MISS, () => this.onNearMiss());
    this.eventBus.on(EVENTS.BOARD_ACTIVATED, () => this.onBoardActivated());
    this.eventBus.on(EVENTS.HOVERBOARD_ACTIVATED, () => this.onBoardActivated());
    this.eventBus.on(EVENTS.SCORE_UPDATED, (score: number) => this.onScoreUpdated(score));
    this.eventBus.on(EVENTS.SEASON_TOKEN_COLLECTED, (count: number = 1) => this.onSeasonTokenCollected(count));
  }

  private onRunStarted(): void {
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
    this.saveState();
  }

  private onRunFinished(): void {
    if (!this.runActive) return;
    this.runActive = false;

    if (this.runScore > this.state.lifetimeStats.bestScore) {
      this.state.lifetimeStats.bestScore = Math.floor(this.runScore);
      this.updateAchievement('ach_highscore', this.state.lifetimeStats.bestScore);
    }

    if (this.activeGameMode === 'TIME_TRIAL' && this.runScore > this.state.lifetimeStats.timeTrialHighScore) {
      this.state.lifetimeStats.timeTrialHighScore = Math.floor(this.runScore);
    }

    if (this.activeGameMode === 'SURVIVAL' && this.runDistance > this.state.lifetimeStats.survivalBestDistance) {
      this.state.lifetimeStats.survivalBestDistance = Math.floor(this.runDistance);
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

    if (this.activeGameMode === 'SURVIVAL') {
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

  public claimAchievementReward(achId: string, tier: AchievementTier): { success: boolean; coinsGranted: number } {
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

    this.saveState();
    return { success: true, coinsGranted: coins };
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
      // Add hoverboard inventory
      UpgradeManager.getInstance().addCoins(Number(milestone.rewardValue) * 300); // Converted or granted as store value
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

  // --- Character & Outfit Collection Management ---

  public getUnlockedCharacters(): string[] {
    return [...this.state.unlockedCharacters];
  }

  public getSelectedCharacter(): string {
    return this.state.selectedCharacter || 'char_jax';
  }

  public isCharacterUnlocked(charId: string): boolean {
    if (charId === 'char_jax') return true;
    return this.state.unlockedCharacters.includes(charId);
  }

  public unlockCharacter(charId: string): boolean {
    if (!this.state.unlockedCharacters.includes(charId)) {
      this.state.unlockedCharacters.push(charId);
      // Auto-unlock default outfit for this character
      const charDef = getCharacterById(charId);
      if (charDef) {
        if (!this.state.unlockedOutfits[charId]) {
          this.state.unlockedOutfits[charId] = [];
        }
        if (!this.state.unlockedOutfits[charId].includes(charDef.defaultOutfitId)) {
          this.state.unlockedOutfits[charId].push(charDef.defaultOutfitId);
        }
        this.state.selectedOutfits[charId] = charDef.defaultOutfitId;
      }
      this.saveState();
      this.eventBus.emit('CHARACTER_UNLOCKED', charId);
      return true;
    }
    return false;
  }

  public getUnlockedOutfits(charId: string): string[] {
    const list = this.state.unlockedOutfits[charId];
    if (!list || list.length === 0) {
      const charDef = getCharacterById(charId);
      return charDef ? [charDef.defaultOutfitId] : ['jax_classic'];
    }
    return [...list];
  }

  public getSelectedOutfit(charId: string): string {
    if (this.state.selectedOutfits[charId]) {
      return this.state.selectedOutfits[charId];
    }
    const charDef = getCharacterById(charId);
    return charDef ? charDef.defaultOutfitId : 'jax_classic';
  }

  public isOutfitUnlocked(charId: string, outfitId: string): boolean {
    const charDef = getCharacterById(charId);
    if (charDef && charDef.defaultOutfitId === outfitId) {
      return this.isCharacterUnlocked(charId);
    }
    const list = this.state.unlockedOutfits[charId] || [];
    return list.includes(outfitId);
  }

  public unlockOutfit(charId: string, outfitId: string): boolean {
    if (!this.state.unlockedOutfits[charId]) {
      this.state.unlockedOutfits[charId] = [];
    }
    if (!this.state.unlockedOutfits[charId].includes(outfitId)) {
      this.state.unlockedOutfits[charId].push(outfitId);
      this.saveState();
      this.eventBus.emit('OUTFIT_UNLOCKED', { charId, outfitId });
      return true;
    }
    return false;
  }

  public equipCharacter(charId: string, outfitId?: string): { success: boolean; message: string } {
    if (!this.isCharacterUnlocked(charId)) {
      return { success: false, message: 'Character is locked' };
    }

    const charDef = getCharacterById(charId);
    if (!charDef) {
      return { success: false, message: 'Character not found' };
    }

    const targetOutfit = outfitId || this.getSelectedOutfit(charId) || charDef.defaultOutfitId;
    if (!this.isOutfitUnlocked(charId, targetOutfit)) {
      return { success: false, message: 'Outfit is locked' };
    }

    this.state.selectedCharacter = charId;
    this.state.selectedOutfits[charId] = targetOutfit;
    this.saveState();

    this.eventBus.emit('CHARACTER_EQUIPPED', { charId, outfitId: targetOutfit });
    return { success: true, message: `Equipped ${charDef.name}!` };
  }

  public purchaseCharacter(charId: string): { success: boolean; message: string } {
    if (this.isCharacterUnlocked(charId)) {
      return { success: false, message: 'Character already owned' };
    }

    const charDef = getCharacterById(charId);
    if (!charDef) {
      return { success: false, message: 'Character not found' };
    }

    if (charDef.unlock.type === 'FREE') {
      this.unlockCharacter(charId);
      this.equipCharacter(charId);
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

      this.unlockCharacter(charId);
      this.equipCharacter(charId);
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
}
