import { CONSTANTS } from '../core/Constants';
import { PatternDifficulty, TrackPattern } from './ObstaclePatterns';

export interface DifficultyBudget {
  tier: PatternDifficulty;
  score: number;
  maxObstaclesPerChunk: number;
  movingTrainAllowed: boolean;
  minReactionDistMeters: number;
  minReactionTimeSeconds: number;
  breatherMandatory: boolean;
  weights: Record<string, number>;
}

export interface DifficultyState {
  runDuration: number;
  distanceTraveled: number;
  currentSpeed: number;
  difficultyScore: number;
  tier: PatternDifficulty;
  consecutiveDifficultCount: number;
  distanceSinceDifficult: number;
  distanceSinceMovingTrain: number;
  timeSinceMovingTrain?: number;
  currentTrainSpeed?: number;
  relativeClosingSpeed?: number;
  budget: DifficultyBudget;
}

/**
 * DifficultyController:
 * Dedicated data-driven pacing and difficulty manager.
 * Evaluates run duration, distance traveled, player speed, obstacle rhythm,
 * and recovery windows. Introduces dynamic ebb-and-flow (tension & release)
 * so the runner feels responsive, engaging, and fair without being monotonous.
 */
export class DifficultyController {
  private runDuration: number = 0;
  private distanceTraveled: number = 0;
  private currentSpeed: number = CONSTANTS.INITIAL_SPEED;
  private gameMode: string = 'NORMAL';

  private consecutiveDifficultCount: number = 0;
  private lastDifficultDistance: number = -999;
  private lastMovingTrainDistance: number = -999;
  private lastMovingTrainTime: number = -999;
  private chunksSpawned: number = 0;

  constructor() {
    this.reset();
  }

  public setGameMode(mode: string): void {
    this.gameMode = mode;
  }

  public getGameMode(): string {
    return this.gameMode;
  }

  public reset(): void {
    this.runDuration = 0;
    this.distanceTraveled = 0;
    this.currentSpeed = CONSTANTS.INITIAL_SPEED;
    this.consecutiveDifficultCount = 0;
    this.lastDifficultDistance = -999;
    this.lastMovingTrainDistance = -999;
    this.lastMovingTrainTime = -999;
    this.chunksSpawned = 0;
  }

  public update(dt: number, distanceTraveled: number, speed: number): void {
    this.runDuration += dt;
    this.distanceTraveled = distanceTraveled;
    this.currentSpeed = speed;
  }

  /**
   * Computes a normalized continuous difficulty score (0.0 to 1.0+).
   * Blends run duration (seconds), distance (meters), speed, and pacing modulation.
   */
  public getDifficultyScore(distanceOverride?: number, speedOverride?: number, durationOverride?: number): number {
    const dist = distanceOverride !== undefined ? distanceOverride : this.distanceTraveled;
    const spd = speedOverride !== undefined ? speedOverride : this.currentSpeed;
    const dur = durationOverride !== undefined
      ? durationOverride
      : (distanceOverride !== undefined && spd > 0 ? dist / spd : this.runDuration);

    // 1. Distance Progression Component (0 to 1800m reaches 0.75+, 2000m+ reaches 1.0)
    const distFactor = Math.min(1.0, dist / 2000.0);

    // 2. Duration Progression Component (0 to 90s reaches 1.0)
    const timeFactor = Math.min(1.0, dur / 90.0);

    // 3. Speed Influence Component (Normalized 18 to 38 m/s)
    const speedRatio = Math.max(0, Math.min(1.0, (spd - CONSTANTS.INITIAL_SPEED) / (CONSTANTS.MAX_SPEED - CONSTANTS.INITIAL_SPEED)));

    // 4. Subtle Pacing Wave: Ebb-and-flow modulation (wavelength ~350m)
    // Creates tension pulses followed by readable rhythm intervals
    const pacingWave = Math.sin((dist / 350.0) * Math.PI * 2.0) * 0.08;

    const baseScore = distFactor * 0.55 + timeFactor * 0.30 + speedRatio * 0.15;
    return Math.max(0, Math.min(1.2, baseScore + pacingWave));
  }

  /**
   * Resolves the primary difficulty tier target based on encounter distance & duration.
   */
  public getTargetTier(distance: number, speed: number): PatternDifficulty {
    if (this.gameMode === 'HARD') {
      if (distance < 60.0) {
        return 'EASY'; // Opening 0-60m is readable intro
      }
      if (distance < 380.0) {
        return 'MEDIUM'; // 0-15s
      }
      if (distance < 850.0) {
        return 'HARD'; // 15-30s
      }
      return 'EXPERT'; // 30s+
    }

    if (distance < 75.0) {
      return 'BEGINNER';
    }
    if (distance < 250.0) {
      return 'EASY';
    }
    if (distance < 750.0) {
      return 'MEDIUM';
    }
    if (distance < 1600.0) {
      return 'HARD';
    }
    return 'EXPERT';
  }

  public getCurrentTier(): PatternDifficulty {
    return this.getTargetTier(this.distanceTraveled, this.currentSpeed);
  }

  /**
   * Determines candidate tier weights for stochastic yet structured pattern selection.
   * Ensures controlled variation and guarantees recovery breathers after intense sections.
   */
  public getTierWeights(distance: number, speed: number, duration?: number): Record<string, number> {
    const dur = duration !== undefined ? duration : (speed > 0 ? distance / speed : this.runDuration);
    const wave = Math.sin((distance / 320.0) * Math.PI * 2.0) * 0.08;

    // Hard Mode specific progression pacing
    if (this.gameMode === 'HARD') {
      // If player just faced multiple hard/expert patterns, mandate a recovery breather!
      if (this.consecutiveDifficultCount >= CONSTANTS.DIFFICULTY_CONFIG.CONSECUTIVE_DIFFICULT_MAX) {
        return {
          BEGINNER: 0.0,
          EASY: 0.30,
          MEDIUM: 0.50,
          HARD: 0.20,
          EXPERT: 0.0,
          BREATHER: 0.65
        };
      }

      if (distance < 380.0 || dur < 15.0) {
        // Stage 1: Opening (0-15s / 0-380m) - Intermediate/Medium focus earlier
        return {
          BEGINNER: 0.05,
          EASY: 0.35,
          MEDIUM: 0.50,
          HARD: 0.10,
          EXPERT: 0.0,
          BREATHER: 0.12
        };
      } else if (distance < 850.0 || dur < 30.0) {
        // Stage 2: Early Run (15-30s / 380-850m) - Escalating density and moving trains
        return {
          BEGINNER: 0.0,
          EASY: 0.15,
          MEDIUM: 0.40,
          HARD: 0.40,
          EXPERT: 0.05,
          BREATHER: 0.10
        };
      } else if (distance < 1950.0 || dur < 60.0) {
        // Stage 3: Mid Run (30-60s / 850-1950m) - High speed, multi-step combinations
        return {
          BEGINNER: 0.0,
          EASY: 0.05,
          MEDIUM: 0.25,
          HARD: 0.45,
          EXPERT: 0.25,
          BREATHER: 0.10 + (wave < 0 ? 0.06 : 0)
        };
      } else if (distance < 4500.0 || dur < 120.0) {
        // Stage 4: Advanced (60-120s / 1950-4500m) - Advanced & expert patterns
        return {
          BEGINNER: 0.0,
          EASY: 0.0,
          MEDIUM: 0.15,
          HARD: 0.45,
          EXPERT: 0.40,
          BREATHER: 0.10 + (wave < 0 ? 0.06 : 0)
        };
      } else {
        // Stage 5: Expert (120s+ / 4500m+) - Sustained high challenge with controlled recovery
        return {
          BEGINNER: 0.0,
          EASY: 0.0,
          MEDIUM: 0.10,
          HARD: 0.40,
          EXPERT: 0.50,
          BREATHER: 0.12 + (wave < 0 ? 0.08 : 0)
        };
      }
    }

    // Normal Mode progression pacing (preserved completely unchanged)
    if (this.consecutiveDifficultCount >= CONSTANTS.DIFFICULTY_CONFIG.CONSECUTIVE_DIFFICULT_MAX) {
      return {
        BEGINNER: 0.10,
        EASY: 0.45,
        MEDIUM: 0.35,
        HARD: 0.05,
        EXPERT: 0.0,
        BREATHER: 0.70
      };
    }

    if (distance < 270.0 || dur < 15.0) {
      // Stage 1: Opening (0-15s / 0-270m)
      return {
        BEGINNER: 0.55,
        EASY: 0.45,
        MEDIUM: 0.0,
        HARD: 0.0,
        EXPERT: 0.0,
        BREATHER: 0.15
      };
    } else if (distance < 750.0 || dur < 35.0) {
      // Stage 2: Early Run (15-30s / 270-750m)
      return {
        BEGINNER: 0.10,
        EASY: 0.45,
        MEDIUM: 0.40,
        HARD: 0.05,
        EXPERT: 0.0,
        BREATHER: 0.12
      };
    } else if (distance < 1600.0 || dur < 70.0) {
      // Stage 3: Mid Run (30-60s / 750-1600m)
      return {
        BEGINNER: 0.0,
        EASY: 0.15,
        MEDIUM: 0.45,
        HARD: 0.35,
        EXPERT: 0.05,
        BREATHER: 0.12 + (wave < 0 ? 0.08 : 0)
      };
    } else if (distance < 3000.0 || dur < 120.0) {
      // Stage 4: Advanced (60-120s / 1500-3000m)
      return {
        BEGINNER: 0.0,
        EASY: 0.05,
        MEDIUM: 0.20,
        HARD: 0.50,
        EXPERT: 0.25,
        BREATHER: 0.12 + (wave < 0 ? 0.08 : 0)
      };
    } else {
      // Stage 5: Expert (120s+ / 3000m+)
      return {
        BEGINNER: 0.0,
        EASY: 0.0,
        MEDIUM: 0.15,
        HARD: 0.45,
        EXPERT: 0.40,
        BREATHER: 0.15 + (wave < 0 ? 0.10 : 0)
      };
    }
  }

  /**
   * Generates the multi-variable Difficulty Budget for procedural track generation.
   */
  public getDifficultyBudget(distance: number, speed: number, duration?: number): DifficultyBudget {
    const tier = this.getTargetTier(distance, speed);
    const score = this.getDifficultyScore(distance, speed, duration);
    const weights = this.getTierWeights(distance, speed, duration);
    const breatherMandatory = this.consecutiveDifficultCount >= CONSTANTS.DIFFICULTY_CONFIG.CONSECUTIVE_DIFFICULT_MAX;

    // Obstacle density budget per 80m chunk
    let maxObstacles = 2;
    if (tier === 'EASY') maxObstacles = 3;
    else if (tier === 'MEDIUM') maxObstacles = 4;
    else if (tier === 'HARD') maxObstacles = 5;
    else if (tier === 'EXPERT') maxObstacles = 6;

    // Dynamic reaction distance scaling
    const minReactionTime = CONSTANTS.DIFFICULTY_CONFIG.MIN_SAFE_REACTION_TIME || 0.55;
    const minReactionDist = Math.max(24.0, speed * minReactionTime);

    return {
      tier,
      score,
      maxObstaclesPerChunk: maxObstacles,
      movingTrainAllowed: this.canSpawnMovingTrain(distance, speed, duration),
      minReactionDistMeters: Math.round(minReactionDist * 10) / 10,
      minReactionTimeSeconds: minReactionTime,
      breatherMandatory,
      weights
    };
  }

  /**
   * Data-Driven Train Speed Progression:
   * Smoothly computes authoritative oncoming train speed based on:
   * 1. Active game mode (NORMAL, HARD, SURVIVAL, etc.)
   * 2. Run distance & progression tier
   * 3. Optional controlled random variation within safe bounds
   * Normal progresses from 20 to 32 m/s; Hard from 26 to 42 m/s.
   */
  public calculateMovingTrainSpeed(
    distanceOverride?: number,
    modeOverride?: string,
    tierOverride?: PatternDifficulty,
    variationSeed?: number
  ): number {
    const dist = distanceOverride !== undefined ? Math.max(0, distanceOverride) : this.distanceTraveled;
    const mode = (modeOverride || this.gameMode || 'NORMAL').toUpperCase();
    const profiles = CONSTANTS.TRAIN_SPEED_PROFILES;
    const profile = profiles[mode as keyof typeof profiles] || profiles.NORMAL;

    let targetSpeed: number = profile.baseSpeed;
    if (dist <= 250.0) {
      // Stage 1: Opening / Early (0m to 250m)
      const t = dist / 250.0;
      targetSpeed = profile.baseSpeed + (profile.earlySpeed - profile.baseSpeed) * t;
    } else if (dist <= 750.0) {
      // Stage 2: Medium progression (250m to 750m)
      const t = (dist - 250.0) / 500.0;
      targetSpeed = profile.earlySpeed + (profile.mediumSpeed - profile.earlySpeed) * t;
    } else if (dist <= 1600.0) {
      // Stage 3: Advanced progression (750m to 1600m)
      const t = (dist - 750.0) / 850.0;
      targetSpeed = profile.mediumSpeed + (profile.advancedSpeed - profile.mediumSpeed) * t;
    } else {
      // Stage 4: Expert asymptotic approach toward maxSpeed (1600m+)
      const progress = dist - 1600.0;
      const span = 1400.0;
      const delta = profile.maxSpeed - profile.advancedSpeed;
      const asymptotic = profile.maxSpeed - delta * Math.exp(-2.0 * (progress / span));
      targetSpeed = Math.min(profile.maxSpeed, Math.max(profile.advancedSpeed, asymptotic));
    }

    // Controlled variation within safe bounds (+/- variationRange)
    if (variationSeed !== undefined) {
      const variation = (variationSeed * 2.0 - 1.0) * profile.variationRange;
      targetSpeed += variation;
    }

    // Difficulty budget control: If runner is at extreme Hard Mode velocity (> 40 m/s)
    // and pattern is already complex (EXPERT / HARD), prevent uncontrolled difficulty stacking
    // by keeping oncoming train speed at a controlled high threshold
    if (mode === 'HARD' && (tierOverride === 'EXPERT' || tierOverride === 'ADVANCED' || tierOverride === 'HARD')) {
      if (this.currentSpeed > 40.0) {
        targetSpeed = Math.min(targetSpeed, profile.advancedSpeed);
      }
    }

    // Strict safety clamp: never exceed profile.maxSpeed and never dip below safe base speed
    return Math.min(profile.maxSpeed, Math.max(profile.baseSpeed - 0.5, targetSpeed));
  }

  /**
   * Calculates true relative closing speed between player and oncoming moving train.
   * Oncoming train closing speed = playerSpeed + trainSpeed.
   */
  public calculateRelativeSpeed(playerSpeed?: number, trainSpeed?: number): number {
    const pSpeed = playerSpeed !== undefined ? playerSpeed : this.currentSpeed;
    const tSpeed = trainSpeed !== undefined ? trainSpeed : this.calculateMovingTrainSpeed();
    return Math.max(1.0, pSpeed + tSpeed);
  }

  /**
   * Calculates available time to impact based on true relative closing speed.
   */
  public calculateTimeToImpact(separationDistance: number, playerSpeed?: number, trainSpeed?: number): number {
    const relSpeed = this.calculateRelativeSpeed(playerSpeed, trainSpeed);
    return separationDistance / relSpeed;
  }

  /**
   * Checks whether a moving train obstacle can fairly spawn at the given distance.
   * Guarantees fair telegraphing, minimum spacing, and time-based reaction windows.
   */
  public canSpawnMovingTrain(atDistance: number, playerSpeed?: number, currentTime?: number): boolean {
    // Opening introductory distance: Hard Mode introduces moving trains earlier (90m vs 240m)
    const introDist = this.gameMode === 'HARD' ? 90.0 : 240.0;
    if (atDistance < introDist) {
      return false;
    }

    // Dynamic moving train gap based on game mode & stage
    let minGap = 75.0;
    if (this.gameMode === 'HARD') {
      if (atDistance >= 2000.0) {
        minGap = 40.0;
      } else if (atDistance >= 800.0) {
        minGap = 50.0;
      } else {
        minGap = 60.0;
      }
    } else {
      if (atDistance >= 3000.0) {
        minGap = 45.0;
      } else if (atDistance >= 1500.0) {
        minGap = 55.0;
      } else if (atDistance >= 650.0) {
        minGap = 65.0;
      }
    }

    const distancePass = (atDistance - this.lastMovingTrainDistance) >= minGap;
    if (!distancePass) {
      return false;
    }

    // Time-based reaction spacing when time is tracked or inferrable from playerSpeed & distance
    const effectiveTime = (currentTime !== undefined && currentTime > 0)
      ? currentTime
      : (playerSpeed !== undefined && playerSpeed > 0 && atDistance > 0 ? atDistance / playerSpeed : (currentTime !== undefined ? currentTime : undefined));

    if (effectiveTime !== undefined && this.lastMovingTrainTime >= 0) {
      const timeGap = effectiveTime - this.lastMovingTrainTime;
      const minTime = this.gameMode === 'HARD'
        ? (atDistance >= 1500.0 ? 1.8 : 2.5)
        : (atDistance >= 1500.0 ? 2.2 : 3.5);
      if (timeGap < minTime && timeGap >= 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Records that a pattern was committed to the track chunk.
   * Updates pacing counters for moving trains and difficult patterns.
   */
  public recordPatternSpawned(pattern: TrackPattern, encounterDistance: number, atTime?: number): void {
    this.chunksSpawned++;

    const isDifficult = pattern.difficulty === 'ADVANCED' || pattern.difficulty === 'HARD' || pattern.difficulty === 'EXPERT';
    if (isDifficult) {
      this.consecutiveDifficultCount++;
      this.lastDifficultDistance = encounterDistance;
    } else {
      // Reset or decrement consecutive intense count
      this.consecutiveDifficultCount = 0;
    }

    const hasMovingTrain = pattern.obstacles.some((o) => o.type === 'MOVING_TRAIN' || o.isMoving);
    if (hasMovingTrain) {
      this.lastMovingTrainDistance = encounterDistance;
      const effectiveTime = (atTime !== undefined && atTime > 0)
        ? atTime
        : (encounterDistance > 0 && this.currentSpeed > 0 ? encounterDistance / this.currentSpeed : (atTime !== undefined ? atTime : this.runDuration));
      this.lastMovingTrainTime = effectiveTime;
    }
  }

  public getState(): DifficultyState {
    const trainSpeed = this.calculateMovingTrainSpeed();
    const relSpeed = this.calculateRelativeSpeed(this.currentSpeed, trainSpeed);
    return {
      runDuration: this.runDuration,
      distanceTraveled: this.distanceTraveled,
      currentSpeed: this.currentSpeed,
      difficultyScore: this.getDifficultyScore(),
      tier: this.getTargetTier(this.distanceTraveled, this.currentSpeed),
      consecutiveDifficultCount: this.consecutiveDifficultCount,
      distanceSinceDifficult: this.distanceTraveled - this.lastDifficultDistance,
      distanceSinceMovingTrain: this.distanceTraveled - this.lastMovingTrainDistance,
      timeSinceMovingTrain: this.lastMovingTrainTime >= 0 ? this.runDuration - this.lastMovingTrainTime : 999.0,
      currentTrainSpeed: trainSpeed,
      relativeClosingSpeed: relSpeed,
      budget: this.getDifficultyBudget(this.distanceTraveled, this.currentSpeed, this.runDuration)
    };
  }
}
