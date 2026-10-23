import { CONSTANTS } from '../core/Constants';

export interface PacingReport {
  speedSamplesCount: number;
  averageSpeed: number;
  currentSpeed: number;
  obstaclesPer10s: number;
  totalObstacles: number;
  averageObstacleGapMeters: number;
  timeSinceLastActionSeconds: number;
  movingTrainCount: number;
  movingTrainFrequencyPerMinute: number;
  difficultyDistribution: Record<string, number>;
  actionDistribution: Record<string, number>;
  minReactionTimeSeconds: number;
  unreachablePatternCount: number;
  fallbackCount: number;
  repeatedPatternCount: number;
}

/**
 * PacingMetrics:
 * Comprehensive development telemetry tracker measuring gameplay rhythm,
 * speed progression, obstacle frequency, reaction windows, and solvability.
 */
export class PacingMetrics {
  private static instance: PacingMetrics | null = null;

  public static getInstance(): PacingMetrics {
    if (!PacingMetrics.instance) {
      PacingMetrics.instance = new PacingMetrics();
    }
    return PacingMetrics.instance;
  }

  // 1. Speed progression samples
  private speedSamples: Array<{ time: number; speed: number }> = [];

  // 2. Obstacle encounters with timestamps
  private obstacleEncounters: Array<{ time: number; type: string; z: number }> = [];
  private lastObstacleZ: number = 0;
  private obstacleGaps: number[] = [];

  // 3. Actions required and timestamps
  private lastActionTime: number = 0;
  private actionCounts: Record<string, number> = {
    JUMP: 0,
    SLIDE: 0,
    LANE_CHANGE: 0
  };

  // 4. Moving train events
  private movingTrainTimes: number[] = [];

  // 5. Pattern difficulty distribution
  private difficultyCounts: Record<string, number> = {
    BEGINNER: 0,
    EASY: 0,
    INTERMEDIATE: 0,
    MEDIUM: 0,
    ADVANCED: 0,
    HARD: 0,
    EXPERT: 0
  };

  // 6. Minimum reaction time observed
  private minReactionTime: number = 999.0;

  // 7. Unreachable patterns & safe fallback diagnostics
  private unreachableCount: number = 0;
  private unreachableLogs: string[] = [];
  private fallbackCount: number = 0;
  private fallbackLogs: string[] = [];
  private repeatedPatternCount: number = 0;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.speedSamples = [];
    this.obstacleEncounters = [];
    this.lastObstacleZ = 0;
    this.obstacleGaps = [];
    this.lastActionTime = 0;
    this.actionCounts = {
      JUMP: 0,
      SLIDE: 0,
      LANE_CHANGE: 0
    };
    this.movingTrainTimes = [];
    this.difficultyCounts = {
      BEGINNER: 0,
      EASY: 0,
      INTERMEDIATE: 0,
      MEDIUM: 0,
      ADVANCED: 0,
      HARD: 0,
      EXPERT: 0
    };
    this.minReactionTime = 999.0;
    this.unreachableCount = 0;
    this.unreachableLogs = [];
    this.fallbackCount = 0;
    this.fallbackLogs = [];
    this.repeatedPatternCount = 0;
  }

  public recordSpeed(timeSec: number, speed: number): void {
    if (this.speedSamples.length >= 600) {
      this.speedSamples.shift();
    }
    this.speedSamples.push({ time: Math.round(timeSec * 10) / 10, speed: Math.round(speed * 10) / 10 });
  }

  public recordObstacle(timeSec: number, type: string, worldZ: number, reactionDist: number = 25.0, speed: number = 20.0): void {
    if (this.lastObstacleZ !== 0) {
      const gap = Math.abs(worldZ - this.lastObstacleZ);
      if (gap > 0.5) {
        this.obstacleGaps.push(gap);
        if (this.obstacleGaps.length > 200) this.obstacleGaps.shift();
      }
    }
    this.lastObstacleZ = worldZ;

    this.obstacleEncounters.push({ time: timeSec, type, z: worldZ });
    if (this.obstacleEncounters.length > 300) {
      this.obstacleEncounters.shift();
    }

    if (type === 'MOVING_TRAIN') {
      this.movingTrainTimes.push(timeSec);
    }

    // Reaction time calculation: reactionDist / effectiveSpeed
    const reactionTime = reactionDist / Math.max(10.0, speed);
    if (reactionTime < this.minReactionTime) {
      this.minReactionTime = reactionTime;
    }
  }

  public recordAction(timeSec: number, actionType?: 'JUMP' | 'SLIDE' | 'LANE_CHANGE'): void {
    this.lastActionTime = timeSec;
    if (actionType && this.actionCounts[actionType] !== undefined) {
      this.actionCounts[actionType]++;
    }
  }

  public recordPattern(name: string, difficulty: string): void {
    const key = difficulty.toUpperCase();
    if (this.difficultyCounts[key] !== undefined) {
      this.difficultyCounts[key]++;
    } else {
      this.difficultyCounts[key] = 1;
    }
  }

  public recordUnreachable(patternName: string, reason: string): void {
    this.unreachableCount++;
    this.unreachableLogs.push(`[${patternName}] ${reason}`);
    console.warn(`🚨 [PACING_METRIC] Unreachable pattern detected: ${patternName} - ${reason}`);
  }

  public recordFallback(lastPatternName: string, reason: string): void {
    this.fallbackCount++;
    this.fallbackLogs.push(`[After ${lastPatternName}] ${reason}`);
    console.warn(`🛡️ [PACING_METRIC] Procedural fallback engaged after ${lastPatternName}: ${reason}`);
  }

  public recordRepeatedPattern(patternName: string): void {
    this.repeatedPatternCount++;
    console.warn(`⚠️ [PACING_METRIC] Repeated pattern detected: ${patternName}`);
  }

  public getObstaclesPer10s(currentTimeSec: number): number {
    const windowStart = currentTimeSec - 10.0;
    return this.obstacleEncounters.filter((e) => e.time >= windowStart).length;
  }

  public getReport(currentTimeSec: number = 0): PacingReport {
    const avgSpeed = this.speedSamples.length > 0
      ? this.speedSamples.reduce((a, b) => a + b.speed, 0) / this.speedSamples.length
      : CONSTANTS.INITIAL_SPEED;

    const currentSpeed = this.speedSamples.length > 0
      ? this.speedSamples[this.speedSamples.length - 1].speed
      : CONSTANTS.INITIAL_SPEED;

    const avgGap = this.obstacleGaps.length > 0
      ? this.obstacleGaps.reduce((a, b) => a + b, 0) / this.obstacleGaps.length
      : 24.0;

    const durationMinutes = Math.max(0.1, currentTimeSec / 60.0);
    const movingTrainFreq = this.movingTrainTimes.length / durationMinutes;

    return {
      speedSamplesCount: this.speedSamples.length,
      averageSpeed: Math.round(avgSpeed * 10) / 10,
      currentSpeed: Math.round(currentSpeed * 10) / 10,
      obstaclesPer10s: this.getObstaclesPer10s(currentTimeSec),
      totalObstacles: this.obstacleEncounters.length,
      averageObstacleGapMeters: Math.round(avgGap * 10) / 10,
      timeSinceLastActionSeconds: Math.round(Math.max(0, currentTimeSec - this.lastActionTime) * 10) / 10,
      movingTrainCount: this.movingTrainTimes.length,
      movingTrainFrequencyPerMinute: Math.round(movingTrainFreq * 10) / 10,
      difficultyDistribution: { ...this.difficultyCounts },
      actionDistribution: { ...this.actionCounts },
      minReactionTimeSeconds: this.minReactionTime === 999.0 ? 0 : Math.round(this.minReactionTime * 100) / 100,
      unreachablePatternCount: this.unreachableCount,
      fallbackCount: this.fallbackCount,
      repeatedPatternCount: this.repeatedPatternCount
    };
  }

  public printSummary(currentTimeSec: number): void {
    const report = this.getReport(currentTimeSec);
    console.log('📊 [PACING_REPORT]', JSON.stringify(report, null, 2));
  }
}
