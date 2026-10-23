import { CONSTANTS } from '../core/Constants';
import { PatternDifficulty, TrackPattern } from './ObstaclePatterns';

export interface DifficultyState {
  runDuration: number;
  distanceTraveled: number;
  currentSpeed: number;
  difficultyScore: number;
  tier: PatternDifficulty;
  consecutiveDifficultCount: number;
  distanceSinceDifficult: number;
  distanceSinceMovingTrain: number;
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

  private consecutiveDifficultCount: number = 0;
  private lastDifficultDistance: number = -999;
  private lastMovingTrainDistance: number = -999;
  private chunksSpawned: number = 0;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.runDuration = 0;
    this.distanceTraveled = 0;
    this.currentSpeed = CONSTANTS.INITIAL_SPEED;
    this.consecutiveDifficultCount = 0;
    this.lastDifficultDistance = -999;
    this.lastMovingTrainDistance = -999;
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
    // Opening 0 - 80m is the opening runway
    if (distance < 75.0) {
      return 'BEGINNER';
    }

    // First 0-15s / 0-250m: Beginner to Easy
    if (distance < 250.0) {
      return 'EASY';
    }

    // 15-35s / 250 - 750m: Intermediate / Medium
    if (distance < 750.0) {
      return 'MEDIUM';
    }

    // 35-70s / 750 - 1600m: Advanced / Hard
    if (distance < 1600.0) {
      return 'HARD';
    }

    // 70s+ / 1600m+: Expert master gauntlets
    return 'EXPERT';
  }

  /**
   * Determines candidate tier weights for stochastic yet structured pattern selection.
   * Ensures controlled variation and guarantees recovery breathers after intense sections.
   */
  public getTierWeights(distance: number, speed: number): Record<string, number> {
    // If player just faced multiple hard/expert patterns, mandate a recovery breather!
    if (this.consecutiveDifficultCount >= CONSTANTS.DIFFICULTY_CONFIG.CONSECUTIVE_DIFFICULT_MAX) {
      return {
        BEGINNER: 0.15,
        EASY: 0.45,
        MEDIUM: 0.35,
        HARD: 0.05,
        EXPERT: 0.0,
        BREATHER: 0.60
      };
    }

    const score = this.getDifficultyScore(distance, speed);

    if (score < 0.18) {
      // Very early game (0-15s)
      return {
        BEGINNER: 0.50,
        EASY: 0.45,
        MEDIUM: 0.05,
        HARD: 0.0,
        EXPERT: 0.0,
        BREATHER: 0.20
      };
    } else if (score < 0.42) {
      // Early-mid game (15-35s)
      return {
        BEGINNER: 0.10,
        EASY: 0.35,
        MEDIUM: 0.50,
        HARD: 0.05,
        EXPERT: 0.0,
        BREATHER: 0.15
      };
    } else if (score < 0.72) {
      // Mid-late game (35-70s)
      return {
        BEGINNER: 0.05,
        EASY: 0.15,
        MEDIUM: 0.40,
        HARD: 0.35,
        EXPERT: 0.05,
        BREATHER: 0.15
      };
    } else {
      // Late game / Expert (70s+)
      return {
        BEGINNER: 0.0,
        EASY: 0.10,
        MEDIUM: 0.25,
        HARD: 0.40,
        EXPERT: 0.25,
        BREATHER: 0.12
      };
    }
  }

  /**
   * Checks whether a moving train obstacle can fairly spawn at the given distance.
   * Guarantees fair telegraphing and minimum spacing between oncoming trains.
   */
  public canSpawnMovingTrain(atDistance: number): boolean {
    // Opening 240m is introductory beginner/easy track to establish rhythm
    if (atDistance < 240.0) {
      return false;
    }
    // Must observe minimum distance gap from previous moving train
    const minGap = CONSTANTS.DIFFICULTY_CONFIG?.MOVING_TRAIN_MIN_GAP || 75.0;
    return (atDistance - this.lastMovingTrainDistance) >= minGap;
  }

  /**
   * Records that a pattern was committed to the track chunk.
   * Updates pacing counters for moving trains and difficult patterns.
   */
  public recordPatternSpawned(pattern: TrackPattern, encounterDistance: number): void {
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
    }
  }

  public getState(): DifficultyState {
    return {
      runDuration: this.runDuration,
      distanceTraveled: this.distanceTraveled,
      currentSpeed: this.currentSpeed,
      difficultyScore: this.getDifficultyScore(),
      tier: this.getTargetTier(this.distanceTraveled, this.currentSpeed),
      consecutiveDifficultCount: this.consecutiveDifficultCount,
      distanceSinceDifficult: this.distanceTraveled - this.lastDifficultDistance,
      distanceSinceMovingTrain: this.distanceTraveled - this.lastMovingTrainDistance
    };
  }
}
