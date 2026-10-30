import { CONSTANTS } from './Constants';
import { EventBus, EVENTS } from './EventBus';

export type SkillEventType = 
  | 'PERFECT_JUMP'
  | 'PERFECT_SLIDE'
  | 'CLEAN_LANE_DODGE'
  | 'NEAR_MISS'
  | 'ROOFTOP_LANDING'
  | 'ROOFTOP_GAP_JUMP'
  | 'CLEAN_OBSTACLE_CHAIN';

export type SkillComboTier = 
  | 'NORMAL'
  | 'MOMENTUM'
  | 'GREAT'
  | 'EXCELLENT'
  | 'MASTERFUL';

export interface SkillTierConfig {
  minCombo: number;
  name: SkillComboTier;
  label: string;
  multiplier: number;
  color: string;
}

export interface SkillEventPayload {
  type: SkillEventType;
  basePoints: number;
  multiplier: number;
  finalPoints: number;
  combo: number;
  tier: SkillComboTier;
  tierLabel: string;
  label: string;
  color: string;
  obstacleId?: string;
}

export interface SkillTelemetryStats {
  totalStylePoints: number;
  bestCombo: number;
  perfectJumps: number;
  perfectSlides: number;
  nearMisses: number;
  cleanDodges: number;
  rooftopLandings: number;
  rooftopGapJumps: number;
  totalRooftopManeuvers: number;
  cleanChains: number;
}

export class SkillComboManager {
  private static instance: SkillComboManager | null = null;

  private comboCount: number = 0;
  private comboTimer: number = 0;
  private readonly windowDuration: number = CONSTANTS.SKILL_COMBO?.WINDOW_DURATION || 4.0;
  private cleanObstacleStreak: number = 0;
  private runStylePoints: number = 0;

  // Track scored actions per obstacle instance to prevent exploit duplicate scoring
  private scoredObstacles: Map<string, Set<string>> = new Map();

  // Statistics for results screen and career progression
  private stats: SkillTelemetryStats = {
    totalStylePoints: 0,
    bestCombo: 0,
    perfectJumps: 0,
    perfectSlides: 0,
    nearMisses: 0,
    cleanDodges: 0,
    rooftopLandings: 0,
    rooftopGapJumps: 0,
    totalRooftopManeuvers: 0,
    cleanChains: 0
  };

  private eventBus = EventBus.getInstance();
  private isSubscribed: boolean = false;

  private constructor() {
    this.setupListeners();
  }

  public static getInstance(): SkillComboManager {
    if (!SkillComboManager.instance) {
      SkillComboManager.instance = new SkillComboManager();
    }
    return SkillComboManager.instance;
  }

  private setupListeners(): void {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    this.eventBus.on(EVENTS.STUMBLE, () => {
      this.breakCombo('STUMBLE');
    });

    this.eventBus.on(EVENTS.CRASH, () => {
      this.breakCombo('CRASH');
    });

    this.eventBus.on('COLLISION_OCCURRED', (diagnostic: any) => {
      if (diagnostic?.outcome === 'PROTECTED_HIT') {
        this.breakCombo('PROTECTED_HIT');
      } else if (diagnostic?.outcome === 'MINOR_STUMBLE') {
        this.breakCombo('STUMBLE');
      } else if (diagnostic?.outcome === 'MAJOR_FATAL_HIT' || diagnostic?.outcome === 'CHASER_CAPTURE') {
        this.breakCombo('CRASH');
      }
    });

    this.eventBus.on(EVENTS.RUN_STARTED, () => {
      this.reset();
    });

    this.eventBus.on(EVENTS.GAME_RESTART, () => {
      this.reset();
    });

    // Note: REVIVE_EXECUTED does NOT restore broken combo (Requirement D)
  }

  /**
   * Resets run combo state, scored obstacle deduplication cache, and telemetry stats.
   */
  public reset(): void {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.cleanObstacleStreak = 0;
    this.runStylePoints = 0;
    this.scoredObstacles.clear();

    this.stats = {
      totalStylePoints: 0,
      bestCombo: 0,
      perfectJumps: 0,
      perfectSlides: 0,
      nearMisses: 0,
      cleanDodges: 0,
      rooftopLandings: 0,
      rooftopGapJumps: 0,
      totalRooftopManeuvers: 0,
      cleanChains: 0
    };

    this.emitComboUpdated();
  }

  /**
   * Authoritative frame update using simulation delta-time.
   * Freezes automatically when game simulation is paused.
   */
  public update(dt: number): void {
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.expireCombo();
      } else {
        this.emitComboUpdated();
      }
    }
  }

  /**
   * Determines current combo tier and multiplier according to configured thresholds.
   */
  public getTierConfig(combo: number = this.comboCount): SkillTierConfig {
    const tiers: readonly SkillTierConfig[] = CONSTANTS.SKILL_COMBO?.TIERS || [
      { minCombo: 1, name: 'NORMAL', label: 'NORMAL', multiplier: 1.0, color: '#00f0ff' },
      { minCombo: 3, name: 'MOMENTUM', label: 'MOMENTUM ⚡', multiplier: 1.25, color: '#facc15' },
      { minCombo: 5, name: 'GREAT', label: 'GREAT 🔥', multiplier: 1.50, color: '#fb923c' },
      { minCombo: 8, name: 'EXCELLENT', label: 'EXCELLENT 💥', multiplier: 1.75, color: '#ec4899' },
      { minCombo: 12, name: 'MASTERFUL', label: 'MASTERFUL 👑', multiplier: 2.00, color: '#c084fc' }
    ];

    let matched = tiers[0];
    for (const tier of tiers) {
      if (combo >= tier.minCombo) {
        matched = tier;
      }
    }
    return matched;
  }

  /**
   * Authoritatively records a legitimate gameplay skill event.
   * Enforces strict deduplication and anti-exploit rules.
   */
  public recordSkillEvent(type: SkillEventType, obstacleId?: string, customBasePoints?: number): SkillEventPayload | null {
    // Anti-exploit: Enforce deduplication against same obstacle instance
    if (obstacleId) {
      let actions = this.scoredObstacles.get(obstacleId);
      if (!actions) {
        actions = new Set<string>();
        this.scoredObstacles.set(obstacleId, actions);
      }
      if (actions.has(type)) {
        return null; // Already awarded this specific skill event for this obstacle encounter
      }
      actions.add(type);
    }

    // Previous tier for milestone detection
    const prevTier = this.getTierConfig(this.comboCount);

    // Increment combo
    this.comboCount++;
    this.comboTimer = this.windowDuration;
    if (this.comboCount > this.stats.bestCombo) {
      this.stats.bestCombo = this.comboCount;
    }

    // Current tier & multiplier
    const currentTier = this.getTierConfig(this.comboCount);

    // Compute style score
    const baseScores = CONSTANTS.SKILL_COMBO?.BASE_SCORES || {
      PERFECT_JUMP: 150,
      PERFECT_SLIDE: 150,
      CLEAN_LANE_DODGE: 100,
      NEAR_MISS: 150,
      ROOFTOP_LANDING: 100,
      ROOFTOP_GAP_JUMP: 250,
      CLEAN_OBSTACLE_CHAIN: 200
    };

    const basePoints = customBasePoints !== undefined ? customBasePoints : (baseScores[type] || 100);
    const maxEventCap = CONSTANTS.SKILL_COMBO?.MAX_EVENT_SCORE || 500;
    const finalPoints = Math.min(maxEventCap, Math.round(basePoints * currentTier.multiplier));

    // Update telemetry stats
    this.stats.totalStylePoints += finalPoints;
    this.runStylePoints += finalPoints;

    switch (type) {
      case 'PERFECT_JUMP':
        this.stats.perfectJumps++;
        break;
      case 'PERFECT_SLIDE':
        this.stats.perfectSlides++;
        break;
      case 'CLEAN_LANE_DODGE':
        this.stats.cleanDodges++;
        break;
      case 'NEAR_MISS':
        this.stats.nearMisses++;
        break;
      case 'ROOFTOP_LANDING':
        this.stats.rooftopLandings++;
        this.stats.totalRooftopManeuvers++;
        break;
      case 'ROOFTOP_GAP_JUMP':
        this.stats.rooftopGapJumps++;
        this.stats.totalRooftopManeuvers++;
        break;
      case 'CLEAN_OBSTACLE_CHAIN':
        this.stats.cleanChains++;
        break;
    }

    // Friendly display label
    let eventLabel = '';
    switch (type) {
      case 'PERFECT_JUMP':
        eventLabel = `PERFECT JUMP +${finalPoints}`;
        break;
      case 'PERFECT_SLIDE':
        eventLabel = `PERFECT SLIDE +${finalPoints}`;
        break;
      case 'CLEAN_LANE_DODGE':
        eventLabel = `CLEAN DODGE +${finalPoints}`;
        break;
      case 'NEAR_MISS':
        eventLabel = `CLOSE CALL +${finalPoints}`;
        break;
      case 'ROOFTOP_LANDING':
        eventLabel = `ROOFTOP LANDING +${finalPoints}`;
        break;
      case 'ROOFTOP_GAP_JUMP':
        eventLabel = `GAP HOP +${finalPoints}`;
        break;
      case 'CLEAN_OBSTACLE_CHAIN':
        eventLabel = `CLEAN CHAIN 🔥 +${finalPoints}`;
        break;
    }

    const payload: SkillEventPayload = {
      type,
      basePoints,
      multiplier: currentTier.multiplier,
      finalPoints,
      combo: this.comboCount,
      tier: currentTier.name,
      tierLabel: currentTier.label,
      label: eventLabel,
      color: currentTier.color,
      obstacleId
    };

    // Emit authoritative skill event
    this.eventBus.emit(EVENTS.SKILL_EVENT, payload);
    this.eventBus.emit(EVENTS.STYLE_SCORE_UPDATED, {
      totalStylePoints: this.stats.totalStylePoints,
      eventPoints: finalPoints
    });

    // Check tier promotion milestone
    if (currentTier.name !== prevTier.name && this.comboCount > 1) {
      this.eventBus.emit(EVENTS.COMBO_MILESTONE, {
        combo: this.comboCount,
        tier: currentTier.name,
        label: currentTier.label,
        color: currentTier.color
      });
    }

    this.emitComboUpdated();
    return payload;
  }

  /**
   * Increment obstacle clearance streak; trigger CLEAN_OBSTACLE_CHAIN at milestones.
   */
  public registerObstacleClearance(): void {
    this.cleanObstacleStreak++;
    if (this.cleanObstacleStreak > 0 && this.cleanObstacleStreak % 3 === 0) {
      this.recordSkillEvent('CLEAN_OBSTACLE_CHAIN');
    }
  }

  /**
   * Breaks the active combo streak immediately upon obstacle collision or stumble.
   */
  public breakCombo(reason: 'STUMBLE' | 'CRASH' | 'PROTECTED_HIT' | 'RESET'): void {
    if (this.comboCount > 0) {
      const lostCombo = this.comboCount;
      this.comboCount = 0;
      this.comboTimer = 0;
      this.cleanObstacleStreak = 0;

      this.eventBus.emit(EVENTS.COMBO_BROKEN, {
        reason,
        lostCombo
      });
      this.emitComboUpdated();
    }
  }

  /**
   * Graceful combo expiration when timer reaches 0 through inactivity.
   */
  private expireCombo(): void {
    if (this.comboCount > 0) {
      const expiredCombo = this.comboCount;
      this.comboCount = 0;
      this.comboTimer = 0;

      this.eventBus.emit(EVENTS.COMBO_EXPIRED, {
        expiredCombo
      });
      this.emitComboUpdated();
    }
  }

  private emitComboUpdated(): void {
    const tier = this.getTierConfig();
    this.eventBus.emit(EVENTS.COMBO_UPDATED, {
      combo: this.comboCount,
      tier: tier.name,
      tierLabel: tier.label,
      multiplier: tier.multiplier,
      color: tier.color,
      timeRemaining: Math.max(0, this.comboTimer),
      maxTime: this.windowDuration,
      ratio: this.comboCount > 0 ? Math.max(0, Math.min(1.0, this.comboTimer / this.windowDuration)) : 0
    });
  }

  public getCombo(): number {
    return this.comboCount;
  }

  public getTier(): SkillComboTier {
    return this.getTierConfig().name;
  }

  public getMultiplier(): number {
    return this.getTierConfig().multiplier;
  }

  public getStats(): SkillTelemetryStats {
    return { ...this.stats };
  }

  public getStylePoints(): number {
    return this.stats.totalStylePoints;
  }

  public getTimeRemaining(): number {
    return Math.max(0, this.comboTimer);
  }

  public getTimeRemainingRatio(): number {
    return this.comboCount > 0 ? Math.max(0, Math.min(1.0, this.comboTimer / this.windowDuration)) : 0;
  }

  public isComboActive(): boolean {
    return this.comboCount > 0;
  }

  /**
   * Resets deduplication set for a recycled obstacle instance.
   */
  public clearScoredObstacle(obstacleId: string): void {
    this.scoredObstacles.delete(obstacleId);
  }
}
