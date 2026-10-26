import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { SpeedController } from '../core/SpeedController';
import { EventBus, EVENTS } from '../core/EventBus';
import { Player, SupportSurfaceType } from '../player/Player';
import { ObstacleFactory, ObstacleInstance } from './ObstacleFactory';
import { CollectibleFactory, CoinPickupVFXInstance } from './CollectibleFactory';
import { TrackChunk } from './TrackChunk';
import { OBSTACLE_PATTERNS, TrackPattern } from './ObstaclePatterns';
import { ReachabilityValidator } from './ReachabilityValidator';
import { DifficultyController } from './DifficultyController';
import { PacingMetrics } from './PacingMetrics';
import { AerialCoinManager } from './AerialCoinManager';
import { GraphicsManager, QualityConfig } from '../scene/GraphicsManager';
import { ChaserModel } from '../characters/ChaserModel';
import { CollisionResolver } from './CollisionResolver';
import { CollisionDiagnostic, CollisionOutcome } from './CollisionTypes';
import { EnvironmentManager, EnvironmentId, EnvironmentTheme } from '../environment/EnvironmentConfig';
import { EnvironmentDirector } from '../environment/EnvironmentDirector';
import { ProgressionManager } from '../progression/ProgressionManager';
import { RooftopRoutePlanner, RooftopRoutePlan, RooftopRouteArchetype } from './RooftopRoutePlanner';
import { CrashReplayManager } from '../replay/CrashReplayManager';
import { SkillComboManager } from '../core/SkillComboManager';
import { DailyChallengeManager } from '../core/DailyChallengeManager';
import { SecretRouteDirector } from './SecretRouteDirector';

export class TrackManager {
  public chunks: TrackChunk[] = [];
  public difficultyController: DifficultyController = new DifficultyController();
  public aerialCoinManager: AerialCoinManager;
  private obstacleFactory: ObstacleFactory;
  private collectibleFactory: CollectibleFactory;
  private eventBus = EventBus.getInstance();
  private envManager = EnvironmentManager.getInstance();

  private activeEnvironment: EnvironmentId = 'MODERN_METRO';
  private targetEnvironment: EnvironmentId = 'MODERN_METRO';
  private chunksUntilTransition: number = 10;

  private furthestZ: number = 0; // Leading edge of the track
  private chunkIndex: number = 0;
  private lastSpawnedPattern: TrackPattern | null = null;
  private get encounterDebugEnabled(): boolean { return !!(import.meta as { env?: { DEV?: boolean } }).env?.DEV || this.isDebugSeed; }
  private nextTrainArrival = 0;
  private nextStaticArrival = 0;
  private lastPlannedArrival = -Infinity;
  private lastRushArrival = -Infinity;
  private rushFollowup = false;
  private trafficOrder: LaneIndex[] = [-1, 1, 0];
  private lastTrainLane: LaneIndex | null = null;
  private encounterPlayer: Player | undefined;
  private observedTrains = new WeakSet<object>();
  private warnedTrains = new WeakSet<object>();
  private visibleRangeTrains = new WeakSet<object>();
  private encounterMetrics = { attempts: 0, placements: 0, occupancyRejections: 0, reachabilityRejections: 0,
    staticAttempts: 0, staticPlacements: 0, staticEncounters: 0, visibleRangeEntries: 0, spacingRejections: 0,
    encounters: 0, warnings: 0, expressEncounters: 0, transitionRejections: 0, windowRejections: 0, lastEncounterTime: 0, gaps: [] as number[] };
  public cleanStreakCount: number = 0;

  // High-speed swept collision tracking to prevent tunneling past collectibles
  private previousPlayerZ: number | null = null;
  private sweptCollectibleBox: THREE.Box3 = new THREE.Box3();
  // Reusable pooled collection particle bursts
  private pickupVfxPool: CoinPickupVFXInstance[] = [];

  // Seedable PRNG (Mulberry32) for reproducible procedural runs and deterministic testing
  private runSeed: number = 1337;
  private currentSeed: number = 1337;
  private isDebugSeed: boolean = false;
  private recentPatterns: string[] = [];
  private lastHazardZ: number = 0;
  private rampOnboardingChecked: boolean = false;
  private chaser: ChaserModel | null = null;
  private collisionDiagnostics: CollisionDiagnostic[] = [];
  private jetpackRecollectedPending: boolean = false;
  private elapsedTime: number = 0;

  // Multi-Train Rooftop Traversal & Switching state
  private activeRooftopPlan: RooftopRoutePlan | null = null;
  private forcedDebugArchetype: RooftopRouteArchetype | null = null;
  private forcedDebugSeed: number | null = null;
  private rooftopStartTime: number = 0;
  private rooftopMeasuredDuration: number = 0;
  private supportLossCount: number = 0;
  private lastSupportLossReason: string = 'NONE';
  private lastMovingDisplacement: number = 0;
  private nextRooftopAllowedZ: number = 110;

  constructor(private scene: THREE.Scene, chaser?: ChaserModel) {
    if (chaser) {
      this.chaser = chaser;
    }
    this.obstacleFactory = new ObstacleFactory();
    this.collectibleFactory = new CollectibleFactory();
    this.aerialCoinManager = new AerialCoinManager(this.scene, this.collectibleFactory);

    // Create pooled chunks
    for (let i = 0; i < CONSTANTS.ACTIVE_CHUNKS; i++) {
      const chunk = new TrackChunk(this.obstacleFactory, this.collectibleFactory);
      this.chunks.push(chunk);
      this.scene.add(chunk.group);
    }

    // Initialize pre-allocated coin collection VFX pool
    this.pickupVfxPool = this.collectibleFactory.createPickupVFXPool(24);
    for (const vfx of this.pickupVfxPool) {
      this.scene.add(vfx.group);
    }

    // Apply active scenery detail level from GraphicsManager
    const currentConfig = GraphicsManager.getInstance().getActiveConfig();
    for (const chunk of this.chunks) {
      chunk.setSceneryDetail(currentConfig.sceneryDetail);
    }

    this.eventBus.on('GRAPHICS_CONFIG_CHANGED', (config: QualityConfig) => {
      for (const chunk of this.chunks) {
        chunk.setSceneryDetail(config.sceneryDetail);
      }
    });

    this.eventBus.on('JETPACK_ACTIVATED', () => {
      if (this.aerialCoinManager && this.aerialCoinManager.isJetpackFlightActive()) {
        this.jetpackRecollectedPending = true;
      }
    });

    this.eventBus.on(EVENTS.RUN_STARTED, (mode: string) => {
      if (mode) {
        this.setGameMode(mode);
      }
    });

    this.reset();
  }

  public setGameMode(mode: string): void {
    this.difficultyController.setGameMode(mode);
    PacingMetrics.getInstance().setTrainSpeedProfile(mode);
  }

  public getGameMode(): string {
    const mode = this.difficultyController.getGameMode();
    if (mode === 'DAILY_CHALLENGE') {
      try {
        const active = DailyChallengeManager.getInstance().getActiveChallenge();
        if (active) return active.difficulty.toUpperCase();
      } catch (_) {}
    }
    return (mode === 'NORMAL' ? 'BEGINNER' : mode).toUpperCase();
  }

  public setSeed(seed: number, isDebug: boolean = true): void {
    this.runSeed = seed;
    this.currentSeed = seed;
    this.isDebugSeed = isDebug;
    this.lastSpawnedPattern = null;
    this.recentPatterns = [];
    this.difficultyController.reset();
    EnvironmentDirector.getInstance().setRunSeed(seed, isDebug);
    SecretRouteDirector.getInstance().setRunSeed(seed);
  }

  public setDebugSeed(seed: number): void {
    this.setSeed(seed, true);
  }

  public getSeed(): number {
    return this.currentSeed;
  }

  public getRunSeed(): number {
    return this.runSeed;
  }

  public isDebugMode(): boolean {
    return this.isDebugSeed;
  }

  public clearDebugSeed(): void {
    this.isDebugSeed = false;
  }

  public generateFreshSeed(): number {
    const fresh = (Math.floor(Math.random() * 2147483647) + 1) >>> 0;
    this.runSeed = fresh;
    this.currentSeed = fresh;
    this.isDebugSeed = false;
    this.lastSpawnedPattern = null;
    this.recentPatterns = [];
    this.difficultyController.reset();
    return fresh;
  }

  public setChaser(chaser: ChaserModel): void {
    this.chaser = chaser;
  }

  public getChaser(): ChaserModel | null {
    return this.chaser;
  }

  private rng(): number {
    let t = (this.currentSeed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Proper Fisher-Yates shuffle using seeded PRNG for uniform, deterministic permutations
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  public getChunks(): TrackChunk[] {
    return this.chunks;
  }

  public findObstacleById(id: string): ObstacleInstance | null {
    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (obs.id === id) return obs;
      }
    }
    return null;
  }

  public getApproachingTrainDistance(playerZ: number): number {
    let nearestDist = 999;
    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;
        if (obs.isMoving || obs.type === 'MOVING_TRAIN') {
          const currentWorldZ = chunk.chunkZ + obs.group.position.z;
          const halfD = (obs.length || CONSTANTS.TRAIN_LENGTH_SHORT) * 0.5;
          const frontZ = currentWorldZ + halfD; // Front bumper of oncoming train
          if (frontZ < playerZ) {
            const dist = playerZ - frontZ;
            if (dist < nearestDist) {
              nearestDist = dist;
            }
          }
        }
      }
    }
    return nearestDist;
  }

  public reset(forceFreshSeed: boolean = false): void {
    if (forceFreshSeed || !this.isDebugSeed) {
      this.generateFreshSeed();
    } else {
      this.currentSeed = this.runSeed;
    }
    EnvironmentDirector.getInstance().setRunSeed(this.currentSeed, this.isDebugSeed);
    SecretRouteDirector.getInstance().resetRunState();
    SecretRouteDirector.getInstance().setRunSeed(this.currentSeed);

    this.furthestZ = 0;
    const mode = this.getGameMode();
    const first = mode === 'HARD'
      ? CONSTANTS.TRAIN_ENCOUNTER_PACING.firstHard
      : (mode === 'EASY' ? CONSTANTS.TRAIN_ENCOUNTER_PACING.firstEasy : CONSTANTS.TRAIN_ENCOUNTER_PACING.firstBeginner);
    this.nextTrainArrival = first[0] + this.rng() * (first[1] - first[0]);
    this.nextStaticArrival = mode === 'HARD' ? 2.8 : (mode === 'EASY' ? 4.0 : 5.0);
    this.lastPlannedArrival = -Infinity;
    this.lastRushArrival = -Infinity;
    this.rushFollowup = false;
    this.lastTrainLane = null;
    this.lastHazardZ = 0;
    this.encounterPlayer = undefined;
    this.observedTrains = new WeakSet();
    this.warnedTrains = new WeakSet();
    this.visibleRangeTrains = new WeakSet();
    this.encounterMetrics = { attempts: 0, placements: 0, occupancyRejections: 0, reachabilityRejections: 0,
      staticAttempts: 0, staticPlacements: 0, staticEncounters: 0, visibleRangeEntries: 0, spacingRejections: 0,
      encounters: 0, warnings: 0, expressEncounters: 0, transitionRejections: 0, windowRejections: 0, lastEncounterTime: 0, gaps: [] };
    this.chunkIndex = 0;
    this.elapsedTime = 0;
    this.cleanStreakCount = 0;
    this.lastSpawnedPattern = null;
    this.recentPatterns = [];
    this.previousPlayerZ = null;
    this.rampOnboardingChecked = false;
    this.difficultyController.reset();
    this.jetpackRecollectedPending = false;
    this.nextRooftopAllowedZ = 110;
    this.activeRooftopPlan = null;
    this.forcedDebugArchetype = null;
    this.forcedDebugSeed = null;
    this.rooftopStartTime = 0;
    this.rooftopMeasuredDuration = 0;
    this.supportLossCount = 0;
    this.lastSupportLossReason = 'NONE';
    this.lastMovingDisplacement = 0;
    if (this.aerialCoinManager) {
      this.aerialCoinManager.reset();
    }

    this.activeEnvironment = this.envManager.getStartingEnvironment();
    this.targetEnvironment = this.activeEnvironment;
    this.chunksUntilTransition = 10;
    const initialTheme = this.envManager.getTheme(this.activeEnvironment);

    for (const vfx of this.pickupVfxPool) {
      vfx.active = false;
      vfx.group.visible = false;
    }

    for (const chunk of this.chunks) chunk.clearDynamicItems();
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const encounterDist = i * CONSTANTS.CHUNK_LENGTH;
      const expectedSpeed = Math.min(
        CONSTANTS.MAX_SPEED,
        CONSTANTS.INITIAL_SPEED + (encounterDist / 300.0) * (24.5 - CONSTANTS.INITIAL_SPEED)
      );
      let pattern = this.selectPattern(i, expectedSpeed, encounterDist, false);
      const hasMovingTrain = pattern.obstacles.some((o) => o.type === 'MOVING_TRAIN' || o.isMoving);
      const dynamicTrainSpeed = hasMovingTrain
        ? this.difficultyController.calculateMovingTrainSpeed(encounterDist, this.difficultyController.getGameMode(), pattern.difficulty, this.rng())
        : undefined;
      pattern = this.populateCompatibleChunk(chunk, pattern, this.furthestZ, initialTheme, false, dynamicTrainSpeed, this.chunks.slice(0, i), (CONSTANTS.SPEED_PROFILES[this.getGameMode() as keyof typeof CONSTANTS.SPEED_PROFILES] || CONSTANTS.SPEED_PROFILES.NORMAL).initialSpeed);
      this.lastSpawnedPattern = pattern;
      this.furthestZ -= CONSTANTS.CHUNK_LENGTH;
      this.chunkIndex++;
    }
  }

  /**
   * Procedural Pattern Selector:
   * Selects reusable patterns based on current distance-based difficulty tier,
   * with physical reachability validation ensuring no impassable chunk transitions.
   */
  public selectPattern(index: number, playerSpeed: number = CONSTANTS.INITIAL_SPEED, distanceTraveled: number = 0, commit: boolean = true): TrackPattern {
    if (index === 0) {
      // Chunk 0: Reset run pacing state and select from opening templates
      this.lastSpawnedPattern = null;
      this.recentPatterns = [];
      this.difficultyController.reset();

      const openingPool = OBSTACLE_PATTERNS.filter((p) => p.isOpening &&
        CONSTANTS.LANE_INDICES.some((lane) => !p.obstacles.some((obs) => obs.lane === lane)));
      const chosenOpening = openingPool.length > 0
        ? openingPool[Math.floor(this.rng() * openingPool.length)]
        : OBSTACLE_PATTERNS[0];

      if (!commit) return chosenOpening;
      this.difficultyController.recordPatternSpawned(chosenOpening, 0);
      this.lastSpawnedPattern = chosenOpening;
      this.recentPatterns = [chosenOpening.name];
      PacingMetrics.getInstance().recordPattern(chosenOpening.name, chosenOpening.difficulty);
      return chosenOpening;
    }

    // 1. Data-Driven Candidate Tier Filtering & Recovery Breathing
    const weights = this.difficultyController.getTierWeights(distanceTraveled, playerSpeed);
    const canSpawnMovingTrain = this.difficultyController.canSpawnMovingTrain(distanceTraveled, playerSpeed, this.elapsedTime);

    const baseCandidates = OBSTACLE_PATTERNS.filter((p) => !p.isOpening && p.name !== 'SAFE_RECOVERY_CONNECTOR');

    // Recent history references
    const last1 = this.recentPatterns.length > 0 ? this.recentPatterns[this.recentPatterns.length - 1] : null;
    const last2 = this.recentPatterns.length > 1 ? this.recentPatterns[this.recentPatterns.length - 2] : null;
    const last3 = this.recentPatterns.length > 2 ? this.recentPatterns[this.recentPatterns.length - 3] : null;

    // Filter by moving train eligibility and calculate weighted score
    interface ScoredCandidate {
      pattern: TrackPattern;
      weight: number;
      key: number;
    }

    const scored: ScoredCandidate[] = [];

    for (const candidate of baseCandidates) {
      // Check moving train eligibility
      const hasMovingTrain = candidate.obstacles.some((o) => o.type === 'MOVING_TRAIN' || o.isMoving);
      if (!canSpawnMovingTrain && hasMovingTrain) {
        continue;
      }

      // Safe route scheduling: postpone low tunnel patterns during active jetpack flight
      if (this.aerialCoinManager && this.aerialCoinManager.isJetpackFlightActive()) {
        const isLowTunnel = candidate.isTunnel || candidate.obstacles.some((o) => o.type === 'TUNNEL_ARCH');
        if (isLowTunnel) {
          continue; // Postpone low tunnel pattern to ensure clear overhead flight corridor
        }
      }

      // Base tier weight (mapping legacy difficulty names)
      let tierKey = candidate.difficulty as string;
      if (tierKey === 'INTERMEDIATE') tierKey = 'MEDIUM';
      if (tierKey === 'ADVANCED') tierKey = 'HARD';

      let tierWeight = weights[tierKey] !== undefined
        ? weights[tierKey]
        : (candidate.isBreather ? weights.BREATHER : 0);

      if (tierWeight <= 0) {
        continue;
      }

      // When moving train is eligible, grant priority to ensure dynamic railway rhythm
      if (canSpawnMovingTrain && hasMovingTrain) {
        tierWeight *= 2.4;
      }

      // Recent history penalties: prevent back-to-back repetitions
      if (candidate.name === last1) {
        tierWeight *= 0.0; // Strictly avoid back-to-back duplicate
      } else if (candidate.name === last2) {
        tierWeight *= 0.15; // 85% penalty for 2 chunks ago
      } else if (candidate.name === last3) {
        tierWeight *= 0.40; // 60% penalty for 3 chunks ago
      }

      if (tierWeight <= 0.001) {
        continue;
      }

      // Action variety bonus (favor complementary action mechanics)
      if (this.lastSpawnedPattern && this.lastSpawnedPattern.requiredActions && candidate.requiredActions) {
        const lastAction = this.lastSpawnedPattern.requiredActions[0];
        if (lastAction === 'JUMP' && candidate.requiredActions.includes('SLIDE')) tierWeight *= 1.35;
        if (lastAction === 'SLIDE' && candidate.requiredActions.includes('JUMP')) tierWeight *= 1.35;
        if (candidate.requiredActions.includes('LANE_CHANGE')) tierWeight *= 1.2;
      }

      // Efraimidis-Spirakis weighted random key
      const randVal = Math.max(0.0001, this.rng());
      const key = Math.pow(randVal, 1.0 / tierWeight);

      scored.push({ pattern: candidate, weight: tierWeight, key });
    }

    // Sort by weighted key descending
    scored.sort((a, b) => b.key - a.key);

    let chosen: TrackPattern | null = null;
    let foundSolvable = false;

    // 2. Physical Reachability Transition Validation across scored candidates
    if (this.lastSpawnedPattern) {
      for (const item of scored) {
        if (ReachabilityValidator.validateChunkTransition(this.lastSpawnedPattern, item.pattern, playerSpeed)) {
          chosen = item.pattern;
          foundSolvable = true;
          break;
        }
      }

      // If no candidate in weighted pool passed, test all base candidates (excluding last1)
      if (!foundSolvable) {
        const fallbackCandidates = this.shuffle(baseCandidates.filter((p) => p.name !== last1));
        for (const candidate of fallbackCandidates) {
          const hasMovingTrain = candidate.obstacles.some((o) => o.type === 'MOVING_TRAIN' || o.isMoving);
          if (!canSpawnMovingTrain && hasMovingTrain) continue;

          if (ReachabilityValidator.validateChunkTransition(this.lastSpawnedPattern, candidate, playerSpeed)) {
            chosen = candidate;
            foundSolvable = true;
            break;
          }
        }
      }
    } else {
      if (scored.length > 0) {
        chosen = scored[0].pattern;
        foundSolvable = true;
      }
    }

    // 3. Guaranteed Safe Fallback if candidate search exhausted
    if (!foundSolvable || !chosen) {
      const recoveryPattern = OBSTACLE_PATTERNS.find((p) => p.name === 'SAFE_RECOVERY_CONNECTOR') || OBSTACLE_PATTERNS[0];
      chosen = recoveryPattern;
      foundSolvable = true;
      PacingMetrics.getInstance().recordFallback(
        this.lastSpawnedPattern ? this.lastSpawnedPattern.name : 'NONE',
        `No candidate pattern passed transition reachability at ${distanceTraveled.toFixed(1)}m, speed ${playerSpeed.toFixed(1)}m/s. Deployed SAFE_RECOVERY_CONNECTOR.`
      );
    }

    if (commit) this.commitPattern(chosen, distanceTraveled);
    return chosen;
  }

  private commitPattern(pattern: TrackPattern, distance: number): void {
    if (this.recentPatterns[this.recentPatterns.length - 1] === pattern.name) {
      PacingMetrics.getInstance().recordRepeatedPattern(pattern.name);
    }
    this.recentPatterns.push(pattern.name);
    if (this.recentPatterns.length > 5) this.recentPatterns.shift();
    if (pattern.obstacles.length > 0) {
      this.lastHazardZ = distance;
    }
    this.difficultyController.recordPatternSpawned(pattern, distance, this.elapsedTime);
    this.lastSpawnedPattern = pattern;
    PacingMetrics.getInstance().recordPattern(pattern.name, pattern.difficulty);
  }

  private remapRailwayPattern(pattern: TrackPattern, lanes: readonly LaneIndex[]): TrackPattern {
    const map = (lane: LaneIndex) => lanes[lane + 1];
    return { ...pattern,
      obstacles: pattern.obstacles.map((obs) => ({ ...obs, lane: map(obs.lane) })),
      collectibles: pattern.collectibles.map((coin) => ({ ...coin, lane: map(coin.lane),
        ...(coin.endLane !== undefined ? { endLane: map(coin.endLane) } : {}) })),
      entryLanes: pattern.entryLanes?.map(map), exitLanes: pattern.exitLanes?.map(map) };
  }

  private populateCompatibleChunk(
    chunk: TrackChunk, pattern: TrackPattern, worldZ: number, theme: EnvironmentTheme,
    isTransition: boolean, _trainSpeed: number | undefined, peers: readonly TrackChunk[], playerSpeed: number
  ): TrackPattern {
    const playerZ = this.encounterPlayer?.position.z ?? 0;
    const distance = this.encounterPlayer?.distanceTraveled ?? 0;
    const pacing = this.difficultyController.getTrainEncounterPacing(distance);
    const runnerCurve = new SpeedController(this.getGameMode() as ConstructorParameters<typeof SpeedController>[0]);
    const config = CONSTANTS.TRAIN_ENCOUNTER_PACING;
    const forecast = (seconds: number, stopDistance = Infinity) => {
      let d = distance, speed = playerSpeed, time = 0;
      while (time < seconds && d < stopDistance) {
        const dt = Math.min(0.1, seconds - time);
        speed += (runnerCurve.evaluateCurve(d) - speed) * (1 - Math.exp(-CONSTANTS.SPEED_LERP * dt));
        d += speed * dt;
        time += dt;
      }
      return { distance: d, time };
    };
    const arrivalFor = (front: number, trainSpeed: number) => {
      let separation = playerZ - front, speed = playerSpeed, d = distance, time = 0;
      while (separation > 0.0001 && time < 30) {
        const dt = Math.min(0.1, separation / Math.max(1, speed + trainSpeed));
        speed += (runnerCurve.evaluateCurve(d) - speed) * (1 - Math.exp(-CONSTANTS.SPEED_LERP * dt));
        separation -= (speed + trainSpeed) * dt;
        d += speed * dt;
        time += dt;
      }
      return this.elapsedTime + time;
    };
    const flight = this.aerialCoinManager?.isJetpackFlightActive() || false;
    if (worldZ === 0) {
      chunk.populate(pattern, worldZ, theme, isTransition, undefined, peers);
      const clear = CONSTANTS.LANE_INDICES.filter((lane) => !pattern.obstacles.some((obs) => obs.lane === lane));
      const first = clear[Math.floor(this.rng() * clear.length)] ?? 0;
      this.trafficOrder = [first, ...this.shuffle(CONSTANTS.LANE_INDICES.filter((lane) => lane !== first))];
      this.commitPattern(pattern, 0);
      return pattern;
    }

    // Deterministic Multi-Train Rooftop Route Encounter Scheduling
    if (this.forcedDebugArchetype || (Math.abs(worldZ) >= this.nextRooftopAllowedZ && !flight)) {
      const mode = this.getGameMode();
      const tier = pacing.stage <= 0 ? 'BEGINNER' : (pacing.stage === 1 ? 'INTERMEDIATE' : (pacing.stage === 2 ? 'ADVANCED' : 'EXPERT'));
      const seed = this.forcedDebugSeed !== null ? this.forcedDebugSeed : (Math.abs(Math.round(worldZ * 31 + this.currentSeed)) % 2147483647);

      const plan = RooftopRoutePlanner.planRoute({
        seed,
        tier,
        playerSpeed,
        gameMode: mode,
        forcedArchetype: this.forcedDebugArchetype || undefined
      });

      this.forcedDebugArchetype = null;
      this.forcedDebugSeed = null;

      const rooftopPattern = RooftopRoutePlanner.createTrackPattern(plan);
      const proof = ReachabilityValidator.validateRooftopRoute(plan, playerSpeed, undefined, mode);

      if (proof.solvable && chunk.populate(rooftopPattern, worldZ, theme, isTransition, undefined, peers)) {
        this.activeRooftopPlan = plan;
        this.rooftopStartTime = this.elapsedTime;
        this.nextRooftopAllowedZ = Math.abs(worldZ) + plan.totalLength + (mode === 'HARD' ? 140.0 : 160.0);

        if (plan.archetype === 'SIDE_SWITCH' || plan.archetype === 'DOUBLE_SWITCH') {
          this.eventBus.emit('SHOW_TRAIN_SWITCH_CUE');
        }

        this.commitPattern(rooftopPattern, worldZ);
        return rooftopPattern;
      }
    }

    // Deterministic Secret Railway Route Encounter Scheduling
    if (!this.activeRooftopPlan && !isTransition) {
      const mode = this.getGameMode();
      const secretPattern = SecretRouteDirector.getInstance().tryScheduleSecretRoute(
        chunk,
        worldZ,
        theme,
        isTransition,
        playerSpeed,
        mode,
        flight
      );
      if (secretPattern) {
        this.commitPattern(secretPattern, Math.abs(worldZ));
        return secretPattern;
      }
    }
    // Reserve approach lanes before choosing ordinary obstacles, rather than
    // waiting for an already blocked train to clear six streamed chunks.
    const rotation = pacing.stage < 2 ? 0 : pacing.stage - 1;
    const traffic = [this.trafficOrder[rotation % 3], this.trafficOrder[(rotation + 1) % 3]];
    const permutations: LaneIndex[][] = [[-1, 0, 1], [-1, 1, 0], [0, -1, 1], [0, 1, -1], [1, -1, 0], [1, 0, -1]];
    const moving = (candidate: TrackPattern) => candidate.obstacles.filter((obs) => obs.isMoving || obs.type === 'MOVING_TRAIN');
    const parked = (candidate: TrackPattern) => candidate.obstacles.filter((obs) =>
      !obs.isMoving && ['TRAIN', 'TRAIN_RAMP', 'TRAIN_COMPOSITION'].includes(obs.type));
    const rank = (candidate: TrackPattern) => ({ BEGINNER: 0, EASY: 0, INTERMEDIATE: 1, MEDIUM: 1, ADVANCED: 2, HARD: 2, EXPERT: 3 })[candidate.difficulty];
    const pool = this.shuffle(OBSTACLE_PATTERNS.filter((candidate) => !candidate.isOpening &&
      rank(candidate) <= pacing.stage && !(flight && (candidate.isTunnel || candidate.obstacles.some((obs) => obs.type === 'TUNNEL_ARCH')))));
    const candidates = [pattern, ...pool].filter((candidate) => !candidate.isOpening && rank(candidate) <= pacing.stage);
    const variation = this.rng();
    const rawSpeed = this.difficultyController.calculateMovingTrainSpeed(Math.abs(worldZ), this.getGameMode(), pattern.difficulty, variation);
    const nominalArrival = arrivalFor(worldZ - 32, rawSpeed);
    const groundArrival = arrivalFor(worldZ - 40, 0);
    const groundPacing = this.difficultyController.getTrainEncounterPacing(forecast(groundArrival - this.elapsedTime).distance);
    const staticDue = groundArrival >= this.nextStaticArrival;
    const trainDue = arrivalFor(worldZ - 68, rawSpeed) >= this.nextTrainArrival - config.placementTolerance;
    const rush = trainDue && (this.rushFollowup || (pacing.rushAllowed &&
      nominalArrival - this.lastRushArrival >= config.rushCooldown && this.rng() < config.rushChance));
    const layouts = candidates.flatMap((candidate) => permutations.map((lanes) => this.remapRailwayPattern(candidate, lanes)));
    // Alternation is a preference; physical occupancy and the full action window
    // remain hard gates, including when the next lane has not cleared yet.
    const activeMode = this.getGameMode();
    const hazardThreshold = activeMode === 'HARD' ? 30 : (activeMode === 'EASY' ? 45 : 65);
    const hazardNeeded = (Math.abs(worldZ) - this.lastHazardZ) > hazardThreshold;
    const repetitionCost = (candidate: TrackPattern) =>
      Number(staticDue !== (parked(candidate).length > 0)) * 40 +
      Number(!!pattern.isBreather && !trainDue && !staticDue && !candidate.isBreather) * 20 +
      Number(hazardNeeded && (candidate.isBreather || candidate.obstacles.length === 0)) * 150 +
      Number(moving(candidate)[0]?.lane === this.lastTrainLane) * 8 + this.recentPatterns.lastIndexOf(candidate.name) + 1;
    layouts.sort((a, b) => repetitionCost(a) - repetitionCost(b));
    const attempt = (candidate: TrackPattern, withTrain: boolean): TrackPattern | null => {
      let trains = moving(candidate);
      if (withTrain && this.encounterPlayer?.isChangingLaneActive()) return null;
      if (withTrain ? (trains.length !== 1 && !(rush && pacing.stage >= 2 && trains.length === 2)) : trains.length !== 0) return null;
      if (withTrain && candidate.obstacles.some((obs) => !obs.isMoving && obs.type !== 'MOVING_TRAIN' && trains.some((t) => t.lane === obs.lane))) return null;
      if (withTrain && trains.some((obs) => !traffic.includes(obs.lane))) return null;
      if (this.lastSpawnedPattern && !ReachabilityValidator.validateChunkTransition(this.lastSpawnedPattern, candidate, playerSpeed)) {
        if (this.encounterDebugEnabled) {
          this.encounterMetrics.reachabilityRejections++;
          this.encounterMetrics.transitionRejections++;
        }
        return null;
      }
      let speed = withTrain ? this.difficultyController.calculateMovingTrainSpeed(Math.abs(worldZ), this.getGameMode(), rush ? 'HARD' : candidate.difficulty, rush ? 1 : variation) : undefined;
      if (speed !== undefined) {
        // A lane's active express cohort shares one track velocity only if close enough to risk rear-ending
        for (const peer of peers) for (const obs of peer.obstacles) {
          if (peer !== chunk && obs.active && obs.isMoving && trains.some((train) => train.lane === obs.lane) && (obs.velocityZ ?? 0) > 0) {
            const myZ = worldZ - (trains.find((t) => t.lane === obs.lane)?.zOffset ?? 0);
            const peerZ = peer.chunkZ + obs.group.position.z;
            if (Math.abs(myZ - peerZ) < 85.0) {
              speed = Math.min(speed, obs.velocityZ!);
            }
          }
        }
        let front = Math.max(...trains.map((train) => worldZ - train.zOffset + (train.length ?? CONSTANTS.TRAIN_LENGTH_SHORT) / 2 + 2.1));
        // Chunk recycling is discrete, but encounter time need not be. Shift only
        // the unpublished moving formation to meet its slot; never teleport it later.
        const target = Math.max(this.nextTrainArrival, this.lastPlannedArrival + config.minimumArrivalGap);
        const seconds = target - this.elapsedTime;
        const shift = Math.min(CONSTANTS.CHUNK_LENGTH - Math.max(...trains.map((train) => train.zOffset)),
          Math.max(0, forecast(seconds).distance - distance + speed * seconds - (playerZ - front)));
        if (shift > 0) {
          candidate = { ...candidate, obstacles: candidate.obstacles.map((obs) =>
            obs.isMoving || obs.type === 'MOVING_TRAIN' ? { ...obs, zOffset: obs.zOffset + shift } : obs) };
          trains = moving(candidate);
          front -= shift;
        }
        const arrival = arrivalFor(front, speed);
        if (arrival - this.lastPlannedArrival < config.minimumArrivalGap || arrival - this.elapsedTime < CONSTANTS.MOVING_TRAIN_WARNING_TIME + 0.3) {
          if (this.encounterDebugEnabled) this.encounterMetrics.spacingRejections++;
          return null;
        }
        if (this.encounterDebugEnabled) this.encounterMetrics.attempts++;
      }
      if (this.encounterDebugEnabled && parked(candidate).length) this.encounterMetrics.staticAttempts++;
      chunk.isAerialCorridor = flight && (!!candidate.isTunnel || theme.id === 'UNDERGROUND_METRO');
      if (!chunk.populate(candidate, worldZ, theme, isTransition, speed, peers)) {
        if (this.encounterDebugEnabled) this.encounterMetrics.occupancyRejections++;
        return null;
      }
      if (withTrain || parked(candidate).length) {
        const placedTrains = chunk.obstacles.filter((obs) => obs.isMoving);
        const train = placedTrains[0];
        const formation = withTrain ? placedTrains : chunk.obstacles.filter((obs) => obs.group.userData.isTrain);
        const front = Math.min(...formation.map((obs) => chunk.chunkZ + obs.group.position.z +
          (obs.group.userData.trainFrontOffset ?? (obs.length! / 2 + 2.1))));
        const arrival = arrivalFor(front, speed ?? 0);
        const hazards = [chunk, ...peers.filter((peer) => peer !== chunk)].flatMap((peer) => peer.obstacles.filter((obs) => obs.active).map((obs) => {
          const box = obs.collider.clone().expandByScalar(0.1);
          if (obs.group.userData.isTrain) {
            box.max.z = Math.max(box.max.z, peer.chunkZ + obs.group.position.z + (obs.group.userData.trainFrontOffset ?? obs.length! / 2 + 2.1));
            box.min.z = Math.min(box.min.z, peer.chunkZ + obs.group.position.z - obs.length! / 2 - 0.55);
          }
          if (obs.rampCollider) box.union(obs.rampCollider);
          if (obs.exitRampCollider) box.union(obs.exitRampCollider);
          return { min: box.min, max: box.max, velocityZ: obs.isMoving ? obs.velocityZ! : 0 };
        }));
        const rear = Math.min(...formation.map((obs) => chunk.chunkZ + obs.group.position.z + (obs.group.userData.trainRearOffset ?? -obs.length! / 2 - CONSTANTS.TRAIN_RAMP_LENGTH)));
        const slowestTailClearance = (playerZ - rear + CONSTANTS.PLAYER_DEPTH / 2) / (playerSpeed + (speed ?? 0));
        const horizon = Math.max(arrival - this.elapsedTime + 1.2,
          slowestTailClearance + CONSTANTS.DIFFICULTY_CONFIG.MIN_SAFE_REACTION_TIME);
        // An avoidance witness never stumbles. Forward speed is monotonic and
        // bounded by the actual target curve at the furthest possible distance.
        const maximumSpeed = Math.max(playerSpeed, runnerCurve.evaluateCurve(distance + Math.max(playerSpeed, runnerCurve.getMaxSpeed()) * horizon));
        const player = this.encounterPlayer;
        const entries = player && !player.isInvulnerable() ? [player.currentLane] : CONSTANTS.LANE_INDICES;
        const proof = ReachabilityValidator.validateTrainWindow(hazards, playerZ, playerSpeed,
          maximumSpeed, horizon, entries);
        if (!proof.solvable) {
          if (this.encounterDebugEnabled) { this.encounterMetrics.reachabilityRejections++; this.encounterMetrics.windowRejections++; }
          return null;
        }
        if (this.encounterDebugEnabled) for (const obs of chunk.obstacles) {
          if (obs.group.userData.isTrain) obs.group.userData.survivalWitness = proof.witness;
        }
        if (withTrain) {
          // A paired approach is one decision. Count it only when its first warned nose passes.
          const encounterGroup = {};
          for (const obs of placedTrains) {
            obs.group.userData.encounterGroup = encounterGroup;
            obs.group.userData.encounterCategory = rush ? 'EXPRESS_RUSH' : 'REGULAR';
            obs.group.userData.sourcePattern = candidate.name;
          }
          if (this.encounterDebugEnabled) {
            this.encounterMetrics.placements++;
          }
          this.lastTrainLane = train.lane;
          this.lastPlannedArrival = arrival;
          if (rush && !this.rushFollowup) {
            this.lastRushArrival = arrival;
            this.rushFollowup = true;
            this.nextTrainArrival = arrival + config.rushPairGap;
          } else {
            this.rushFollowup = false;
            const interval = pacing.minGap + this.rng() * (pacing.maxGap - pacing.minGap);
            const nextPacing = this.difficultyController.getTrainEncounterPacing(forecast(arrival - this.elapsedTime + interval).distance);
            if (nextPacing.stage > pacing.stage) {
              const boundary = this.elapsedTime + forecast(arrival - this.elapsedTime + interval, config.stages[pacing.stage].end).time;
              this.nextTrainArrival = Math.max(boundary + nextPacing.minGap * 0.25,
                arrival + nextPacing.minGap + this.rng() * (nextPacing.maxGap - nextPacing.minGap));
            } else this.nextTrainArrival = arrival + interval;
          }
        }
      }
      if (parked(candidate).length) {
        const staticGroup = {};
        for (const obs of chunk.obstacles) if (!obs.isMoving && obs.group.userData.isTrain) {
          obs.group.userData.encounterGroup = staticGroup;
          obs.group.userData.sourcePattern = candidate.name;
        }
        if (this.encounterDebugEnabled) this.encounterMetrics.staticPlacements++;
        const firstFront = Math.max(...chunk.obstacles.filter((obs) => !obs.isMoving && obs.group.userData.isTrain)
          .map((obs) => chunk.chunkZ + obs.group.position.z + (obs.group.userData.trainFrontOffset ?? obs.length! / 2)));
        this.nextStaticArrival = arrivalFor(firstFront, 0) + groundPacing.staticMinGap +
          this.rng() * (groundPacing.staticMaxGap - groundPacing.staticMinGap);
      }
      this.commitPattern(candidate, Math.abs(worldZ));
      return candidate;
    };
    if (trainDue && !flight) for (const candidate of layouts) {
      const accepted = attempt(candidate, true);
      if (accepted) return accepted;
    }
    for (const candidate of layouts) {
      const accepted = attempt(candidate, false);
      if (accepted) return accepted;
    }
    // If ordinary layouts fail, try non-breather active candidates before defaulting to recovery
    if (hazardNeeded) {
      const activeCandidates = candidates.filter((c) => !c.isBreather && c.obstacles.length > 0);
      for (const cand of activeCandidates) {
        for (const lanes of permutations) {
          const accepted = attempt(this.remapRailwayPattern(cand, lanes), false);
          if (accepted) return accepted;
        }
      }
    }
    // The existing recovery connector can always be mapped to the non-traffic lane.
    const recovery = OBSTACLE_PATTERNS.find((candidate) => candidate.name === 'SAFE_RECOVERY_CONNECTOR')!;
    for (const lanes of permutations) {
      const accepted = attempt(this.remapRailwayPattern(recovery, lanes), false);
      if (accepted) return accepted;
    }
    throw new Error('No reachable layout preserves the active railway corridors');
  }

  public getTrainEncounterMetrics() {
    const gaps = this.encounterMetrics.gaps;
    const trains = this.chunks.flatMap((chunk) => chunk.obstacles).filter((obs) => obs.active && obs.isMoving);
    const playerZ = this.encounterPlayer?.position.z ?? 0;
    return { ...this.encounterMetrics, gaps: [...gaps], distance: this.difficultyController.getState().distanceTraveled,
      stage: this.difficultyController.getTrainEncounterPacing().stage,
      runnerSpeed: this.encounterPlayer?.speed ?? CONSTANTS.INITIAL_SPEED,
      nextPlannedArrival: this.nextTrainArrival,
      activeTrains: trains.length,
      activeStaticTrains: this.chunks.reduce((count, chunk) => count + chunk.obstacles.filter((obs) =>
        obs.active && !obs.isMoving && obs.group.userData.isTrain).length, 0),
      relevantTrains: trains.filter((obs) => obs.collider.min.z < playerZ + CONSTANTS.DESPAWN_DISTANCE_BEHIND &&
        obs.collider.max.z > playerZ - CONSTANTS.ACTIVE_CHUNKS * CONSTANTS.CHUNK_LENGTH).length,
      movingTrainSpeeds: trains.map((obs) => obs.velocityZ),
      rejectedPlacementReasons: { solidOccupancy: this.encounterMetrics.occupancyRejections,
        patternTransition: this.encounterMetrics.transitionRejections, movingActionWindow: this.encounterMetrics.windowRejections,
        arrivalSpacing: this.encounterMetrics.spacingRejections },
      averageGap: gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0 };
  }

  public update(player: Player, dt: number, time: number = 0): void {
    this.encounterPlayer = player;
    this.elapsedTime += dt;
    // 0. Update difficulty controller pacing
    this.difficultyController.update(dt, player.distanceTraveled, player.speed);
    PacingMetrics.getInstance().setCurrentDifficultyTier(this.difficultyController.getCurrentTier());

    // 0.1 Update pooled coin collection particle bursts
    this.updatePickupVFX(dt);

    // 0.2 Dedicated Aerial Coin Trail System & Flight Lifecycle Integration
    if (player.powerups.isJetpackActive() || player.state === 'JETPACK') {
      if (!this.aerialCoinManager.isJetpackFlightActive()) {
        this.aerialCoinManager.onJetpackActivated(player);
        this.prepareSafeLandingRunway(player);
      } else if (this.jetpackRecollectedPending) {
        this.aerialCoinManager.onJetpackRefreshed(player);
        this.prepareSafeLandingRunway(player);
        this.jetpackRecollectedPending = false;
      }
    }

    const boardMagnetBonus = player.hoverboardManager ? player.hoverboardManager.getMagnetRadiusBonus() : 0;
    const isMagnet = player.powerups.isMagnetActive() || boardMagnetBonus > 0;
    const magnetRadius = (player.powerups.isMagnetActive() ? player.powerups.getMagnetRadius() : 0) + boardMagnetBonus;

    this.aerialCoinManager.update(
      player,
      dt,
      time,
      isMagnet,
      magnetRadius,
      (pos: THREE.Vector3) => this.triggerCoinPickupVFX(pos)
    );

    // Safe Landing Runway: Continually clears and verifies landing corridor during descent
    if (player.getJetpackPhase() === 'DESCENT' || (player.powerups.isJetpackActive() && player.powerups.getJetpackRemaining() <= 2.2)) {
      this.prepareSafeLandingRunway(player);
    }

    // 1. Recycle trailing chunks ahead of player
    for (const chunk of this.chunks) {
      const chunkEndZ = chunk.chunkZ - CONSTANTS.CHUNK_LENGTH;
      if (chunkEndZ > player.position.z + CONSTANTS.DESPAWN_DISTANCE_BEHIND) {
        // Guard: Never recycle a chunk while the player is currently supported on its train/ramp/roof
        const isSupportingPlayer = chunk.obstacles.some(
          (o) => o.id === player.getActiveSupportObstacleId() ||
                 (Boolean(o.carriageGroupId) && o.carriageGroupId === player.getActiveSupportGroupId()) ||
                 (Boolean(o.routeGroupId) && o.routeGroupId === this.activeRooftopPlan?.id && player.getSupportSurface() !== 'GROUND')
        );
        const isPlayerPhysicallyInChunk = player.position.z <= chunk.chunkZ + 2.0 && player.position.z >= chunkEndZ - 2.0;
        if (isSupportingPlayer || (player.getSupportSurface() !== 'GROUND' && isPlayerPhysicallyInChunk)) {
          continue;
        }

        if (this.encounterDebugEnabled) {
          const wouldBreakSupport = chunk.obstacles.some((o) => o.id === player.getActiveSupportObstacleId());
          if (wouldBreakSupport) {
            console.warn('[TrackManager] Guard assertion failed: Chunk about to be reused contains player active support obstacle!');
          }
        }

        // Clean-section streak check when recycling chunk
        if (!chunk.chunkHadCollision && chunk.obstacles.length > 0) {
          this.cleanStreakCount++;
          this.eventBus.emit(EVENTS.CLEAN_STREAK, this.cleanStreakCount);
        } else if (chunk.chunkHadCollision) {
          this.cleanStreakCount = 0;
        }

        // Check if flight is active across upcoming chunk
        const isFlightActive = this.aerialCoinManager.isJetpackFlightActive() || (player && player.powerups.isJetpackActive());

        // Environment theme & transition portal selection
        let spawnPortal = false;
        let chunkTheme = this.envManager.getTheme(this.activeEnvironment);
        const selectionPref = this.envManager.getSelectionPreference();

        if (selectionPref === 'DYNAMIC') {
          // Postpone dynamic underground transition during active open-air flight
          if (isFlightActive) {
            this.chunksUntilTransition = Math.max(1, this.chunksUntilTransition);
          } else {
            this.chunksUntilTransition--;
          }

          if (this.chunksUntilTransition <= 0) {
            spawnPortal = true;
            this.targetEnvironment = this.envManager.getOtherEnvironment(this.activeEnvironment);
            chunkTheme = this.envManager.getTheme(this.targetEnvironment);
            this.chunksUntilTransition = 10;
            this.eventBus.emit('ENVIRONMENT_TRANSITION_APPROACHING', {
              from: this.activeEnvironment,
              to: this.targetEnvironment,
              portalZ: this.furthestZ
            });
          } else if (this.activeEnvironment !== this.targetEnvironment) {
            this.activeEnvironment = this.targetEnvironment;
            chunkTheme = this.envManager.getTheme(this.activeEnvironment);
            this.eventBus.emit('ENVIRONMENT_CHANGED', this.activeEnvironment);
          }
        } else {
          this.activeEnvironment = selectionPref as EnvironmentId;
          this.targetEnvironment = this.activeEnvironment;
          chunkTheme = this.envManager.getTheme(this.activeEnvironment);
        }

        const encounterDist = Math.abs(this.furthestZ);
        let pattern = this.selectPattern(this.chunkIndex++, player.speed, encounterDist, false);
        const hasMovingTrain = pattern.obstacles.some((o) => o.type === 'MOVING_TRAIN' || o.isMoving);
        const dynamicTrainSpeed = hasMovingTrain
          ? this.difficultyController.calculateMovingTrainSpeed(encounterDist, this.difficultyController.getGameMode(), pattern.difficulty, this.rng())
          : undefined;
        pattern = this.populateCompatibleChunk(chunk, pattern, this.furthestZ, chunkTheme, spawnPortal, dynamicTrainSpeed, this.chunks, player.speed);
        this.lastSpawnedPattern = pattern;
        this.furthestZ -= CONSTANTS.CHUNK_LENGTH;
      }
    }

    // Validate every new layout at the same simulation instant, then advance once.
    for (const chunk of this.chunks) chunk.update(dt, time, player.position.z, player.speed);

    if (this.encounterDebugEnabled) for (const current of this.chunks) for (const obs of current.obstacles) {
      if (!obs.active || !obs.group.userData.isTrain) continue;
      if (obs.telegraphed && !this.warnedTrains.has(obs)) { this.warnedTrains.add(obs); this.encounterMetrics.warnings++; }
      const front = current.chunkZ + obs.group.position.z + (obs.group.userData.trainFrontOffset ?? obs.length! / 2);
      // Proximity is a debug visibility proxy, not a claim of camera/frustum rendering.
      if (front < player.position.z && player.position.z - front <= CONSTANTS.MOVING_TRAIN_TELEGRAPH_DIST &&
          obs.group.visible && !this.visibleRangeTrains.has(obs)) {
        this.visibleRangeTrains.add(obs);
        this.encounterMetrics.visibleRangeEntries++;
      }
      const encounter = obs.group.userData.encounterGroup ?? obs;
      if ((!obs.isMoving || obs.telegraphed) && front >= player.position.z && !this.observedTrains.has(encounter)) {
        this.observedTrains.add(encounter);
        if (!obs.isMoving) { this.encounterMetrics.staticEncounters++; continue; }
        if (this.encounterMetrics.encounters > 0) {
          this.encounterMetrics.gaps.push(this.elapsedTime - this.encounterMetrics.lastEncounterTime);
          if (this.encounterMetrics.gaps.length > 64) this.encounterMetrics.gaps.shift();
        }
        this.encounterMetrics.lastEncounterTime = this.elapsedTime;
        this.encounterMetrics.encounters++;
        if (obs.group.userData.encounterCategory === 'EXPRESS_RUSH') this.encounterMetrics.expressEncounters++;
      }
    }

    // 1.1 Determine whether player is currently enclosed inside a low tunnel
    let isPlayerInEnclosedTunnel = false;
    for (const chunk of this.chunks) {
      const chunkStartZ = chunk.chunkZ;
      const chunkEndZ = chunk.chunkZ - CONSTANTS.CHUNK_LENGTH;
      if (player.position.z <= chunkStartZ && player.position.z >= chunkEndZ) {
        if (chunk.isTunnel && !chunk.isAerialCorridor) {
          isPlayerInEnclosedTunnel = true;
          break;
        }
      }
    }
    player.setTunnelEnclosed(isPlayerInEnclosedTunnel);

    // 2. Dynamic Ground Height Check (Train Roofs & Ramps)
    this.updateGroundHeight(player, dt);

    // 2.1 First-encounter unobtrusive onboarding cue for climbable train ramps
    if (!this.rampOnboardingChecked) {
      this.checkRampOnboarding(player);
    }

    // 3. Collision & Collectibles Detection
    this.checkCollisions(player, dt);
  }

  /**
   * First-encounter unobtrusive onboarding cue:
   * Emits a brief, non-intrusive HUD micro-pill [ ▲ CLIMB RAMP TO ROOF ]
   * when the player approaches their first climbable ramp within 32m.
   * Persisted in localStorage so it never repeats or interrupts experienced runs.
   */
  private checkRampOnboarding(player: Player): void {
    if (typeof localStorage !== 'undefined') {
      try {
        if (localStorage.getItem('metro_runner_first_ramp_seen') === 'true') {
          this.rampOnboardingChecked = true;
          return;
        }
      } catch (_) {}
    }

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (obs.active && obs.hasRamp && obs.rampCollider) {
          const rampStart = obs.rampCollider.max.z;
          const distToRamp = player.position.z - rampStart;
          const playerLane = player.currentLane !== undefined ? player.currentLane : 0;
          if (distToRamp > 0 && distToRamp < 32.0 && Math.abs(playerLane - obs.lane) <= 1) {
            this.rampOnboardingChecked = true;
            if (typeof localStorage !== 'undefined') {
              try {
                localStorage.setItem('metro_runner_first_ramp_seen', 'true');
              } catch (_) {}
            }
            this.eventBus.emit(EVENTS.RAMP_ONBOARDING_CUE);
            return;
          }
        }
      }
    }
  }

  /**
   * Safe Landing Corridor:
   * Inspects upcoming track chunks covering the touchdown zone [landingZ + 6m, landingZ - 36m].
   * Ensures the runner's landing lane is 100% free of lethal obstacles (trains, high barriers, etc.),
   * guaranteeing a physically clear runway so the runner never lands into an unavoidable crash.
   */
  public prepareSafeLandingRunway(player: Player): void {
    const remaining = player.powerups.getJetpackRemaining();
    const dynamicLandingZ = player.position.z - Math.max(CONSTANTS.INITIAL_SPEED, player.speed) * Math.max(0, remaining);
    const landingZ = (remaining <= 3.0 || player.getJetpackPhase() === 'DESCENT')
      ? dynamicLandingZ
      : this.aerialCoinManager.getLandingZ();

    const landingLane = player.currentLane;
    this.aerialCoinManager.setLandingLane(landingLane);

    // Guaranteed clearance covers from current player position through 35m past touchdown
    const runwayZStart = player.position.z + 4.0;
    const runwayZEnd = landingZ - (CONSTANTS.JETPACK_SAFE_LANDING_RUNWAY || 35.0);

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        const obsWorldZMin = obs.collider.min.z;
        const obsWorldZMax = obs.collider.max.z;

        const inTouchdownZ = obsWorldZMax >= runwayZEnd && obsWorldZMin <= runwayZStart;
        const inLandingLane = obs.lane === landingLane;

        if (inTouchdownZ && inLandingLane) {
          obs.active = false;
          chunk.group.remove(obs.group);
        }
      }
    }
  }  /**
   * Swept continuous collision detection & exact per-segment roof landing resolution.
   * Evaluates player's foot/pivot trajectory across the frame against real carriage/gangway segments.
   */
  public tryResolveSweptRoofLanding(player: Player, obs: ObstacleInstance): boolean {
    if (!obs.active) return false;

    const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
    const p0 = player.previousPosition;
    const p1 = player.position;

    // Require descending vertical motion or a descending jump phase.
    const isDescending = player.verticalVelocity <= 0.1 || p1.y <= p0.y || player.state === 'FALLING' || player.state === 'FALLING_FROM_TRAIN';
    if (!isDescending) return false;

    // Do not accept ascending contact as a landing
    if (player.verticalVelocity > 0.1 && p1.y > p0.y && p1.y < roofY) {
      return false;
    }

    // Determine whether the player's foot/pivot trajectory crossed the roof plane during the frame
    const crossedPlane = p0.y >= roofY - 0.10 && p1.y <= roofY + 0.15;
    const withinCaptureWindow = (player.isJumping || player.state === 'FALLING' || player.state === 'FALLING_FROM_TRAIN') &&
      p1.y >= roofY - 0.55 && p1.y <= roofY + 0.85;

    if (!crossedPlane && !withinCaptureWindow) return false;

    // Solve interpolation crossing point
    let crossX = p1.x;
    let crossZ = p1.z;
    let t = 1.0;

    const dy = p0.y - p1.y;
    if (dy > 1e-4 && p0.y >= roofY - 0.05) {
      t = Math.max(0, Math.min(1, (p0.y - roofY) / dy));
      crossX = p0.x + t * (p1.x - p0.x);
      crossZ = p0.z + t * (p1.z - p0.z);
    }

    // For a moving train, evaluate the roof segment in the correct previous/current relative frame
    if (obs.isMoving && obs.previousWorldZ !== undefined) {
      const chunk = this.chunks.find((c) => c.obstacles.includes(obs));
      const currentTrainZ = (chunk ? chunk.chunkZ : 0) + obs.group.position.z;
      const trainDeltaZ = currentTrainZ - obs.previousWorldZ;
      crossZ += (1 - t) * trainDeltaZ;
    }

    // Permit only a small edge tolerance (roughly 0.10-0.20m) to prevent floating-point edge misses
    const tolX = 0.18;
    const tolZ = 0.18;

    let hitValidSegment = false;
    if (obs.roofSegments && obs.roofSegments.length > 0) {
      for (const seg of obs.roofSegments) {
        if (
          crossX >= seg.collider.min.x - tolX &&
          crossX <= seg.collider.max.x + tolX &&
          crossZ >= seg.collider.min.z - tolZ &&
          crossZ <= seg.collider.max.z + tolZ
        ) {
          hitValidSegment = true;
          break;
        }
      }
    } else if (obs.roofCollider) {
      if (
        crossX >= obs.roofCollider.min.x - tolX &&
        crossX <= obs.roofCollider.max.x + tolX &&
        crossZ >= obs.roofCollider.min.z - tolZ &&
        crossZ <= obs.roofCollider.max.z + tolZ
      ) {
        hitValidSegment = true;
      }
    }

    if (hitValidSegment) {
      const targetGroupId = obs.carriageGroupId || obs.routeGroupId || null;
      player.resolveRoofLanding(roofY, obs.id, targetGroupId);
      return true;
    }

    return false;
  }

  private updateGroundHeight(player: Player, dt: number = 0.016): void {
    // Carry an existing grounded rider before testing the platform's new bounds.
    // Use actual displacement, so landing this frame never adds a second movement.
    const previousSupport = this.findObstacleById(player.getActiveSupportObstacleId() || '');
    this.lastMovingDisplacement = 0;
    if (!player.isJumping && previousSupport?.active && previousSupport.isMoving && previousSupport.previousWorldZ !== undefined) {
      const supportChunk = this.chunks.find((chunk) => chunk.obstacles.includes(previousSupport));
      if (supportChunk) {
        const deltaZ = supportChunk.chunkZ + previousSupport.group.position.z - previousSupport.previousWorldZ;
        player.position.z += deltaZ;
        this.lastMovingDisplacement = deltaZ;
        player.updateCollider();
        player.mesh.position.copy(player.position);
      }
    }

    let targetGroundY: number = CONSTANTS.PLAYER_BASE_Y;
    let foundSupport = false;
    let supportedObstacleId: string | null = null;
    let supportedGroupId: string | null = null;
    let supportType: SupportSurfaceType = 'GROUND';

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        // 1. Check if player is on or ascending a sloped ramp
        if (obs.rampCollider) {
          const inRampX = player.position.x >= obs.rampCollider.min.x && player.position.x <= obs.rampCollider.max.x;
          // Ramp covers from max.z (base at ground) to min.z (top at roof)
          // Extend tolerance slightly at the upper junction (0.35m) so forward steps across the boundary do not drop support
          const rampStart = obs.rampCollider.max.z;
          const rampEnd = obs.rampCollider.min.z;
          const inRampZ = player.position.z >= rampEnd - 0.35 && player.position.z <= rampStart + 0.35;

          if (inRampX && inRampZ) {
            const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
            const t = Math.max(0, Math.min(1, (rampStart - player.position.z) / (rampStart - rampEnd)));
            const calculatedHeight = CONSTANTS.PLAYER_BASE_Y + t * (roofY - CONSTANTS.PLAYER_BASE_Y);

            const currFeetY = player.position.y;
            const isNearSurface = Math.abs(currFeetY - calculatedHeight) <= 0.85;
            const isAscendingOrGrounded = !player.isJumping || player.verticalVelocity <= 0.1 || isNearSurface;

            if (isAscendingOrGrounded) {
              targetGroundY = calculatedHeight;
              foundSupport = true;
              supportedObstacleId = obs.id;
              supportedGroupId = obs.carriageGroupId || obs.routeGroupId || null;
              // If reached top edge (t >= 0.98), promote to TRAIN_ROOF smoothly
              supportType = t >= 0.98 ? 'TRAIN_ROOF' : 'RAMP';
              if (t >= 0.98) {
                targetGroundY = roofY;
              }

              // Synchronize player position and collider immediately so collision resolution
              // uses the newly resolved height in this same frame
              if (!player.isJumping) {
                player.position.y = targetGroundY;
                player.updateCollider();
              }
              break;
            }
          }
        }

        // 2. Check if player is on or descending a sloped exit ramp down to ground
        if (obs.exitRampCollider) {
          const inExitX = player.position.x >= obs.exitRampCollider.min.x && player.position.x <= obs.exitRampCollider.max.x;
          // Exit ramp covers from max.z (top at roof) to min.z (base at ground)
          const exitStart = obs.exitRampCollider.max.z; // top at roof
          const exitEnd = obs.exitRampCollider.min.z;   // base at ground
          const inExitZ = player.position.z >= exitEnd - 0.35 && player.position.z <= exitStart + 0.35;

          if (inExitX && inExitZ) {
            const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
            const t = Math.max(0, Math.min(1, (exitStart - player.position.z) / (exitStart - exitEnd)));
            const calculatedHeight = roofY - t * (roofY - CONSTANTS.PLAYER_BASE_Y);

            const currFeetY = player.position.y;
            const isNearSurface = Math.abs(currFeetY - calculatedHeight) <= 0.85;
            const isDescendingOrGrounded = !player.isJumping || player.verticalVelocity <= 0.1 || isNearSurface;

            if (isDescendingOrGrounded) {
              targetGroundY = calculatedHeight;
              foundSupport = true;
              supportedObstacleId = obs.id;
              supportedGroupId = obs.carriageGroupId || obs.routeGroupId || null;
              // If reached bottom edge (t >= 0.98), promote to GROUND smoothly
              supportType = t >= 0.98 ? 'GROUND' : 'RAMP';
              if (t >= 0.98) {
                targetGroundY = CONSTANTS.PLAYER_BASE_Y;
              }

              if (!player.isJumping) {
                player.position.y = targetGroundY;
                player.updateCollider();
              }
              break;
            }
          }
        }

        // 3. Check if player is on top of or descending onto a train roof
        if (obs.roofCollider) {
          const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);

          if (player.isJumping || player.state === 'FALLING' || player.state === 'FALLING_FROM_TRAIN') {
            // Swept continuous collision detection & landing capture on real carriage/gangway segments
            if (this.tryResolveSweptRoofLanding(player, obs)) {
              targetGroundY = roofY;
              foundSupport = true;
              supportedObstacleId = obs.id;
              supportedGroupId = obs.carriageGroupId || obs.routeGroupId || null;
              supportType = 'TRAIN_ROOF';
              break;
            }
          } else {
            // Running/grounded on roof: check if player is physically within a valid carriage or gangway segment
            let inValidSegment = false;
            if (obs.roofSegments && obs.roofSegments.length > 0) {
              inValidSegment = obs.roofSegments.some((seg) =>
                player.position.x >= seg.collider.min.x - 0.18 &&
                player.position.x <= seg.collider.max.x + 0.18 &&
                player.position.z >= seg.collider.min.z - 0.18 &&
                player.position.z <= seg.collider.max.z + 0.18
              );
            } else {
              const minX = obs.roofCollider.min.x;
              const maxX = obs.roofCollider.max.x;
              const minZ = obs.roofCollider.min.z;
              const maxZ = obs.roofCollider.max.z + 0.35;
              inValidSegment =
                player.position.x >= minX && player.position.x <= maxX &&
                player.position.z >= minZ && player.position.z <= maxZ;
            }

            if (inValidSegment) {
              const isSupportedByThisTrain = player.getActiveSupportObstacleId() === obs.id ||
                (Boolean(obs.carriageGroupId) && player.getActiveSupportGroupId() === obs.carriageGroupId) ||
                (Boolean(obs.routeGroupId) && player.getActiveSupportGroupId() === obs.routeGroupId);

              if (player.position.y >= roofY - 0.55 || isSupportedByThisTrain) {
                targetGroundY = roofY;
                foundSupport = true;
                supportedObstacleId = obs.id;
                supportedGroupId = obs.carriageGroupId || obs.routeGroupId || null;
                supportType = 'TRAIN_ROOF';

                player.position.y = roofY;
                player.updateCollider();
                break;
              }
            }
          }
        }
      }
      if (foundSupport) break;
    }

    if (foundSupport && supportedObstacleId) {
      player.setGroundHeight(targetGroundY);
      player.setSupportSurface(supportType, supportedObstacleId, supportedGroupId);
      if (player.state !== 'SLIDE' && player.state !== 'JETPACK') {
        player.state = supportType === 'RAMP' ? 'CLIMBING' : (supportType === 'GROUND' ? 'RUN' : 'ON_TRAIN');
      }
      if (supportType === 'TRAIN_ROOF') {
        this.rooftopMeasuredDuration += dt;
      }

      if (!this.rampOnboardingChecked && (supportType === 'RAMP' || supportType === 'TRAIN_ROOF')) {
        this.rampOnboardingChecked = true;
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('metro_runner_first_ramp_seen', 'true');
          } catch (_) {}
        }
      }
    } else {
      targetGroundY = CONSTANTS.PLAYER_BASE_Y;
      const prevSurface = player.getSupportSurface();
      if ((prevSurface === 'TRAIN_ROOF' || prevSurface === 'RAMP') && !player.isJumping && player.position.y > targetGroundY + 0.15) {
        // Stepped off train roof or ramp into open air (e.g. unbridged jump gap)
        this.supportLossCount++;
        this.lastSupportLossReason = 'UNSUPPORTED_ROOF_GAP';
        player.setSupportSurface('GROUND', null);
        player.isJumping = true;
        player.state = 'FALLING_FROM_TRAIN';
        player.verticalVelocity = Math.min(player.verticalVelocity, -2.0);
      } else {
        player.setSupportSurface('GROUND', null);
        if (player.state === 'ON_TRAIN' || player.state === 'CLIMBING') {
          player.state = 'RUN';
        }
      }
      player.setGroundHeight(targetGroundY);
    }
  }

  /**
   * Computes squared distance from point (px,py,pz) to 3D line segment [V, W]
   */
  private distToSegmentSquared(
    px: number, py: number, pz: number,
    vx: number, vy: number, vz: number,
    wx: number, wy: number, wz: number
  ): number {
    const dx = wx - vx;
    const dy = wy - vy;
    const dz = wz - vz;
    const l2 = dx * dx + dy * dy + dz * dz;
    if (l2 === 0) {
      const ex = px - vx;
      const ey = py - vy;
      const ez = pz - vz;
      return ex * ex + ey * ey + ez * ez;
    }
    const t = Math.max(0, Math.min(1, ((px - vx) * dx + (py - vy) * dy + (pz - vz) * dz) / l2));
    const projX = vx + t * dx;
    const projY = vy + t * dy;
    const projZ = vz + t * dz;
    const rx = px - projX;
    const ry = py - projY;
    const rz = pz - projZ;
    return rx * rx + ry * ry + rz * rz;
  }

  private checkCollisions(player: Player, dt: number): void {
    const playerBox = player.collider;
    // High-speed full 3D swept volume to prevent tunneling or missed coins at high speed (up to 45m/s)
    this.sweptCollectibleBox.copy(playerBox);
    const prevPos = player.previousPosition;
    if (prevPos) {
      const halfW = CONSTANTS.PLAYER_WIDTH * 0.5 + 0.45;
      const halfD = CONSTANTS.PLAYER_DEPTH * 0.5 + 0.45;
      const height = (player.isSliding ? CONSTANTS.PLAYER_HEIGHT_SLIDE : CONSTANTS.PLAYER_HEIGHT_RUN) + 0.45;

      this.sweptCollectibleBox.min.set(
        Math.min(playerBox.min.x, prevPos.x - halfW),
        Math.min(playerBox.min.y, prevPos.y - 0.25),
        Math.min(playerBox.min.z, prevPos.z - halfD)
      );
      this.sweptCollectibleBox.max.set(
        Math.max(playerBox.max.x, prevPos.x + halfW),
        Math.max(playerBox.max.y, prevPos.y + height),
        Math.max(playerBox.max.z, prevPos.z + halfD)
      );
    } else if (this.previousPlayerZ !== null) {
      const zDelta = Math.abs(player.position.z - this.previousPlayerZ);
      const maxPhysicalStep = Math.max(1.8, (player.speed || CONSTANTS.INITIAL_SPEED) * dt * 1.5 + 0.5);
      if (zDelta <= maxPhysicalStep) {
        this.sweptCollectibleBox.min.z = Math.min(playerBox.min.z, this.previousPlayerZ - 0.45);
        this.sweptCollectibleBox.max.z = Math.max(playerBox.max.z, this.previousPlayerZ + 0.45);
      }
    }
    const sweptCollectibleBox = this.sweptCollectibleBox;
    const previousPlayerZ = this.previousPlayerZ;
    this.previousPlayerZ = player.position.z;

    const boardMagnetBonus = player.hoverboardManager ? player.hoverboardManager.getMagnetRadiusBonus() : 0;
    const isMagnet = player.powerups.isMagnetActive() || boardMagnetBonus > 0;
    const magnetRadius = (player.powerups.isMagnetActive() ? player.powerups.getMagnetRadius() : 0) + boardMagnetBonus;

    // Overhead obstacle check to prevent character snapping upright or jumping under low barriers
    let isUnderOverhead = false;
    for (const chunk of this.chunks) {
      if (Math.abs(chunk.chunkZ - player.position.z) > CONSTANTS.CHUNK_LENGTH * 1.5) continue;
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;
        if (obs.type === 'HIGH_BARRIER' || obs.type === 'TUNNEL_ARCH') {
          const overlapZ = playerBox.min.z <= obs.collider.max.z + 0.3 && playerBox.max.z >= obs.collider.min.z - 0.3;
          const overlapX = playerBox.min.x <= obs.collider.max.x && playerBox.max.x >= obs.collider.min.x;
          if (overlapZ && overlapX) {
            isUnderOverhead = true;
            break;
          }
        }
      }
      if (isUnderOverhead) break;
    }
    player.setUnderOverheadObstacle(isUnderOverhead);

    for (const chunk of this.chunks) {
      // Obstacle Collisions
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        // Record approach encounter lane for lane dodge detection
        if (obs.playerEncounterLane === undefined && player.position.z > obs.collider.max.z && player.position.z <= obs.collider.max.z + 25.0) {
          obs.playerEncounterLane = player.currentLane;
        }

        // Direct obstacle collision check
        const lethalBox = (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP')
          ? (obs.bodyCollider || obs.collider)
          : obs.collider;

        // Near-miss candidate registration (Passes within close margin without touching)
        if (!obs.nearMissTriggered && !obs.nearMissScored && !obs.hadCollision) {
          if (obs.nearMissBox.intersectsBox(playerBox) && !lethalBox.intersectsBox(playerBox)) {
            obs.nearMissCandidate = true;
            // Confirm near miss if player has safely cleared the front impact threshold
            if (player.position.z < lethalBox.max.z - 0.4 && player.state !== 'JETPACK' && player.position.y <= 4.5) {
              obs.nearMissTriggered = true;
              obs.nearMissScored = true;
              this.eventBus.emit(EVENTS.NEAR_MISS);
              SkillComboManager.getInstance().recordSkillEvent('NEAR_MISS', obs.id);
            }
          }
        }

        let hasDirectCollision = lethalBox.intersectsBox(playerBox);

        // Continuous swept collision for fast-moving oncoming obstacles (prevents tunneling through player at high speeds or frame spikes)
        let hasSweptCollision = false;
        let hasFrontalImpact = false;
        if (obs.isMoving && obs.previousWorldZ !== undefined) {
          const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
          // Only check swept collision if player is at hazard height (not safely on roof or high airborne)
          if (player.position.y < roofY - 0.25 && player.state !== 'JETPACK' && player.getJetpackPhase() === 'NONE') {
            const trainDeltaZ = chunk.chunkZ + obs.group.position.z - obs.previousWorldZ;
            // Sweep the runner relative to the moving body. Testing the two swept
            // world bounds separately gives false hits for parallel motion.
            let entry = 0;
            let exit = 1;
            let frontEntry = -Infinity;
            for (const axis of ['x', 'y', 'z'] as const) {
              const end = player.position[axis];
              const start = (prevPos?.[axis] ?? (axis === 'z' ? previousPlayerZ ?? end : end))
                + (axis === 'z' ? trainDeltaZ : 0);
              const delta = end - start;
              const min = lethalBox.min[axis] - (playerBox.max[axis] - end);
              const max = lethalBox.max[axis] - (playerBox.min[axis] - end);
              if (Math.abs(delta) < 1e-9) {
                if (start < min || start > max) { exit = -1; break; }
              } else {
                const a = (min - start) / delta;
                const b = (max - start) / delta;
                if (axis === 'z' && delta < 0 && start >= max) frontEntry = b;
                entry = Math.max(entry, Math.min(a, b));
                exit = Math.min(exit, Math.max(a, b));
                if (entry > exit) break;
              }
            }
            hasSweptCollision = entry <= exit;
            // Classify the first contact, rather than treating a frontal hit as a
            // side glance after the runner has advanced inside the body this frame.
            hasFrontalImpact = hasSweptCollision && frontEntry >= entry - 1e-8;
          }
        }

        if (hasDirectCollision || hasSweptCollision) {
          const resolution = CollisionResolver.resolveOutcome(obs, player, this.chaser, hasFrontalImpact);
          const { outcome, diagnostic, isGlance, isFlankContact } = resolution;

          if (outcome === 'SAFE_CONTACT' || outcome === 'VALID_ROOF_LANDING') {
            // Safe contact / roof landing
            continue;
          }

          // Authoritative non-safe collision occurred
          obs.hadCollision = true;
          obs.nearMissCandidate = false;
          chunk.chunkHadCollision = true;

          // Authoritative collision outcome recorded & emitted
          this.recordCollisionDiagnostic(diagnostic);
          this.eventBus.emit('COLLISION_OCCURRED', diagnostic);

          switch (outcome) {
            case 'PROTECTED_HIT':
              chunk.chunkHadCollision = true;
              if (player.powerups.hasShieldActive()) {
                player.powerups.consumeShield();
              } else if (player.hoverboardManager.isBoardActive()) {
                player.hoverboardManager.breakBoard();
              }
              obs.active = false;
              chunk.group.remove(obs.group);
              return;

            case 'MINOR_STUMBLE':
              chunk.chunkHadCollision = true;
              if (isGlance && isFlankContact) {
                player.bounceBackFromSide();
              } else {
                player.stumble();
              }
              if (this.chaser) {
                this.chaser.onMinorStumble();
              }
              return;

            case 'CHASER_CAPTURE':
              chunk.chunkHadCollision = true;
              if (this.chaser) {
                this.chaser.setChaseState('CAPTURE');
              }
              CrashReplayManager.getInstance().recordFatalCrash({
                reason: 'CHASER_CAPTURE',
                obstacle: obs,
                diagnostic,
                player,
                chaser: this.chaser,
                isFrontal: false,
                isFlankContact: isFlankContact,
                isGlance: isGlance
              });
              player.crash('CHASER_CAPTURE');
              return;

            case 'MAJOR_FATAL_HIT':
              chunk.chunkHadCollision = true;
              if (this.chaser) {
                this.chaser.triggerCaughtReaction();
              }
              const fatalReason = (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP')
                ? 'TRAIN_COLLISION'
                : obs.type;
              const fatal = player.crash(fatalReason);
              if (!fatal) {
                obs.active = false;
                chunk.group.remove(obs.group);
              } else {
                CrashReplayManager.getInstance().recordFatalCrash({
                  reason: fatalReason,
                  obstacle: obs,
                  diagnostic,
                  player,
                  chaser: this.chaser,
                  isFrontal: resolution.isFrontal,
                  isFlankContact,
                  isGlance
                });
              }
              return;
          }
        }

        // Clean obstacle dodge check when player safely passes past the obstacle
        if (!obs.passed && playerBox.max.z < obs.collider.min.z) {
          obs.passed = true;
          if (obs.active && !chunk.chunkHadCollision && !obs.hadCollision) {
            this.eventBus.emit(EVENTS.OBSTACLE_DODGED, obs.type);

            // Authoritative Skill Event Evaluations (Supressed during passive high-altitude jetpack flight)
            if (player.state !== 'JETPACK' && player.getJetpackPhase() === 'NONE' && player.position.y <= 4.5) {
              const comboMgr = SkillComboManager.getInstance();
              const laneX = CONSTANTS.LANES[obs.lane];
              const isInObstacleLane = player.currentLane === obs.lane || Math.abs(player.position.x - laneX) < 1.4;

              // 1. PERFECT_JUMP (clearing hurdle safely)
              if ((obs.type === 'LOW_BARRIER' || obs.type === 'ROOFTOP_AC_HURDLE' || obs.type === 'ROOFTOP_VENT') && isInObstacleLane) {
                const hurdleHeight = obs.collider.max.y;
                const wasJumpingOver = (player.isJumping || player.distanceTraveled - player.lastJumpDist < 12.0) &&
                                       (player.position.y >= hurdleHeight - 0.25 || player.position.y >= 1.40);
                if (wasJumpingOver) {
                  comboMgr.recordSkillEvent('PERFECT_JUMP', obs.id);
                }
              }
              // 2. PERFECT_SLIDE (clearing overhead barrier safely)
              else if ((obs.type === 'HIGH_BARRIER' || obs.type === 'TUNNEL_ARCH') && isInObstacleLane) {
                const wasSlidingUnder = player.isSliding || (player.distanceTraveled - player.lastSlideDist < 12.0);
                if (wasSlidingUnder) {
                  comboMgr.recordSkillEvent('PERFECT_SLIDE', obs.id);
                }
              }
              // 3. CLEAN_LANE_DODGE (evading oncoming obstacle by changing lane cleanly)
              else if (obs.playerEncounterLane !== undefined && obs.playerEncounterLane === obs.lane && player.currentLane !== obs.lane) {
                comboMgr.recordSkillEvent('CLEAN_LANE_DODGE', obs.id);
              }

              // 4. NEAR_MISS (Confirm candidate near miss on safe clearance)
              if (obs.nearMissCandidate && !obs.nearMissScored) {
                obs.nearMissScored = true;
                obs.nearMissTriggered = true;
                this.eventBus.emit(EVENTS.NEAR_MISS);
                comboMgr.recordSkillEvent('NEAR_MISS', obs.id);
              }

              // 5. Clean Obstacle Chain
              comboMgr.registerObstacleClearance();
            }
          }
        }
      }

      // Collectibles Collisions & Magnet Attraction
      const playerChestPos = player.position.clone();
      playerChestPos.y += 0.5; // Aim magnet pull at player chest/magnet aura level

      for (const col of chunk.collectibles) {
        if (!col.active) continue;

        const colWorldPos = new THREE.Vector3(
          col.group.position.x,
          col.group.position.y,
          chunk.chunkZ + col.group.position.z
        );

        // Ground coins are not collected from far above while high in jetpack flight
        const isGroundCollectible = colWorldPos.y < 3.0;
        const isPlayerHighInFlight = player.position.y > 3.2;
        if (isPlayerHighInFlight && isGroundCollectible) {
          continue;
        }

        // Magnet attraction effect with upgraded radius and smooth 3D acceleration
        if (isMagnet && col.type === 'COIN') {
          const distSq = colWorldPos.distanceToSquared(playerChestPos);
          if (distSq < magnetRadius * magnetRadius) {
            col.isMagnetized = true;
            const dist = Math.sqrt(distSq);
            // Smooth arcade acceleration: accelerates from 18m/s to 38m/s near player
            const normDist = Math.max(0, 1.0 - dist / magnetRadius);
            const speed = 18.0 + normDist * normDist * 22.0;
            const dir = playerChestPos.clone().sub(colWorldPos).normalize();

            // Move mesh in full 3D toward chest without snapping Y
            col.group.position.addScaledVector(dir, speed * dt);
            colWorldPos.addScaledVector(dir, speed * dt);

            // Synchronize collider continuously in world space
            col.collider.setFromCenterAndSize(colWorldPos, new THREE.Vector3(1.4, 1.4, 1.4));
          }
        } else if (!isMagnet) {
          col.isMagnetized = false;
        }

        // Collection check: full 3D swept box, 3D trajectory segment test, and proximity
        const prevChestPos = prevPos ? prevPos.clone() : playerChestPos.clone();
        if (prevPos) prevChestPos.y += 0.5;

        const distSqToSegment = this.distToSegmentSquared(
          colWorldPos.x, colWorldPos.y, colWorldPos.z,
          prevChestPos.x, prevChestPos.y, prevChestPos.z,
          playerChestPos.x, playerChestPos.y, playerChestPos.z
        );
        const pickupRadius = CONSTANTS.COIN_PICKUP_RADIUS || 1.1;
        const distToCurrent = colWorldPos.distanceTo(playerChestPos);

        const isCollected = col.collider.intersectsBox(sweptCollectibleBox) ||
          distSqToSegment <= pickupRadius * pickupRadius ||
          distToCurrent <= pickupRadius ||
          (isMagnet && col.isMagnetized && distToCurrent <= 1.5);

        if (isCollected) {
          col.active = false;
          chunk.group.remove(col.group);

          // Trigger lightweight pooled golden particle splash
          this.triggerCoinPickupVFX(colWorldPos);

          if (col.type === 'COIN') {
            this.eventBus.emit(EVENTS.COIN_COLLECTED);
          } else if (col.type === 'SEASON_TOKEN') {
            this.eventBus.emit(EVENTS.SEASON_TOKEN_COLLECTED, 1);
          } else if (col.type === 'CHRONO_ORB') {
            this.eventBus.emit('CHRONO_ORB_COLLECTED', 5);
          } else if (col.type === 'KEY') {
            ProgressionManager.getInstance().addKeys(1);
            this.eventBus.emit('KEY_COLLECTED', 1);
          } else {
            if (col.type === 'JETPACK' && this.aerialCoinManager.isJetpackFlightActive()) {
              this.aerialCoinManager.onJetpackRefreshed(player);
              this.prepareSafeLandingRunway(player);
            }
            this.eventBus.emit(EVENTS.POWERUP_COLLECTED, col.type);
          }
        }
      }
    }
  }

  private triggerCoinPickupVFX(pos: THREE.Vector3): void {
    const vfx = this.pickupVfxPool.find((v) => !v.active);
    if (!vfx) return;

    vfx.active = true;
    vfx.age = 0;
    vfx.group.position.copy(pos);
    vfx.group.visible = true;

    // Reset expanding halo ring
    vfx.ring.scale.set(0.4, 0.4, 0.4);
    (vfx.ring.material as THREE.MeshBasicMaterial).opacity = 0.95;

    // Reset sparkles
    for (let i = 0; i < vfx.sparkles.length; i++) {
      const s = vfx.sparkles[i];
      s.position.set(0, 0, 0);
      s.scale.setScalar(1.0);
      (s.material as THREE.MeshBasicMaterial).opacity = 1.0;
    }
  }

  private updatePickupVFX(dt: number): void {
    for (const vfx of this.pickupVfxPool) {
      if (!vfx.active) continue;

      vfx.age += dt;
      const progress = Math.min(1.0, vfx.age / vfx.maxAge);

      if (progress >= 1.0) {
        vfx.active = false;
        vfx.group.visible = false;
        continue;
      }

      // Smooth expansion and fade for ring
      const ringScale = 0.4 + progress * 2.2;
      vfx.ring.scale.set(ringScale, ringScale, ringScale);
      (vfx.ring.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.95;

      // Radiate sparkle diamonds outward and upward with subtle gravity
      for (let i = 0; i < vfx.sparkles.length; i++) {
        const s = vfx.sparkles[i];
        const vel = vfx.sparkleVelocities[i];
        s.position.x += vel.x * dt;
        s.position.y += vel.y * dt - 9.8 * dt * dt * 0.5;
        s.position.z += vel.z * dt;
        s.scale.setScalar(Math.max(0.01, 1.0 - progress * 0.85));
        (s.material as THREE.MeshBasicMaterial).opacity = 1.0 - progress;
      }
    }
  }

  public recordCollisionDiagnostic(
    obsOrDiag: any,
    classification?: string,
    player?: Player
  ): void {
    let diag: any;
    if (obsOrDiag && typeof obsOrDiag === 'object' && 'finalOutcome' in obsOrDiag) {
      diag = obsOrDiag;
    } else {
      const obs = obsOrDiag;
      const p = player!;
      diag = {
        timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
        collidingObject: obs?.type,
        classification: classification || 'MAJOR_FATAL_HIT',
        lane: obs?.lane,
        obstacleId: obs?.id,
        activeSupportObstacleId: p ? p.getActiveSupportObstacleId() : null,
        playerLane: p ? p.currentLane : 0,
        targetLane: p ? p.targetLane : 0,
        playerState: p ? p.state : 'RUN',
        supportSurface: p ? p.getSupportSurface() : 'GROUND',
        playerPosition: p ? {
          x: Math.round(p.position.x * 100) / 100,
          y: Math.round(p.position.y * 100) / 100,
          z: Math.round(p.position.z * 100) / 100
        } : { x: 0, y: 0, z: 0 },
        playerVelocityY: p ? Math.round(p.verticalVelocity * 100) / 100 : 0,
        groundY: p ? Math.round(p.groundY * 100) / 100 : 0,
        activeGuardState: this.chaser ? this.chaser.getChaseState() : 'DISTANT',
        playerProtectionState: p ? {
          hasShield: p.powerups.hasShieldActive(),
          hasHoverboard: p.hoverboardManager.isBoardActive(),
          isInvulnerable: p.isInvulnerable()
        } : { hasShield: false, hasHoverboard: false, isInvulnerable: false },
        finalOutcome: classification || 'MAJOR_FATAL_HIT',
        collider: obs?.collider ? {
          min: { x: obs.collider.min.x, y: obs.collider.min.y, z: obs.collider.min.z },
          max: { x: obs.collider.max.x, y: obs.collider.max.y, z: obs.collider.max.z }
        } : null,
        roofCollider: obs?.roofCollider ? {
          min: { x: obs.roofCollider.min.x, y: obs.roofCollider.min.y, z: obs.roofCollider.min.z },
          max: { x: obs.roofCollider.max.x, y: obs.roofCollider.max.y, z: obs.roofCollider.max.z }
        } : null,
        roofLandingConsidered: p && obs ? p.position.y >= (obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15)) - 0.45 : false
      };
    }

    this.collisionDiagnostics.push(diag);
    if (this.collisionDiagnostics.length > 50) {
      this.collisionDiagnostics.shift();
    }

    if (typeof window !== 'undefined') {
      (window as any).__LAST_COLLISION_DIAGNOSTIC__ = diag;
      if (!(window as any).__COLLISION_LOG__) {
        (window as any).__COLLISION_LOG__ = [];
      }
      (window as any).__COLLISION_LOG__.push(diag);
      if ((window as any).__COLLISION_LOG__.length > 50) {
        (window as any).__COLLISION_LOG__.shift();
      }
      if ((window as any).__DEBUG_COLLIDERS__) {
        console.warn('⚠️ [COLLISION_DIAGNOSTIC]', diag);
      }
    }
  }

  public getCollisionDiagnostics(): CollisionDiagnostic[] {
    return [...this.collisionDiagnostics];
  }

  public getLastCollisionDiagnostic(): CollisionDiagnostic | null {
    return this.collisionDiagnostics.length > 0
      ? this.collisionDiagnostics[this.collisionDiagnostics.length - 1]
      : null;
  }

  public clearCollisionDiagnostics(): void {
    this.collisionDiagnostics = [];
  }

  public getActiveEnvironment(): EnvironmentId {
    return this.activeEnvironment;
  }

  public setEnvironment(envId: EnvironmentId): void {
    this.activeEnvironment = envId;
    this.targetEnvironment = envId;
    this.envManager.savePreference(envId);
    const director = EnvironmentDirector.getInstance();
    director.jumpToDistrict(envId);
    const theme = this.envManager.getTheme(envId);
    for (const chunk of this.chunks) {
      const chunkIndex = Math.round(Math.abs(chunk.chunkZ / chunk.length));
      director.decorateChunk(chunk, chunk.chunkZ, chunkIndex, { forceTheme: theme });
    }
    this.eventBus.emit('ENVIRONMENT_CHANGED', envId, theme);
  }

  public getChunksUntilTransition(): number {
    return this.chunksUntilTransition;
  }

  /**
   * Deterministic Safe-Respawn System
   * Deactivates the lethal collision obstacle and clears immediate hazard zone [Z - 10, Z + 6].
   * Ensures the player is placed in a guaranteed open lane with at least 12-15m reachable runway.
   */
  public prepareSafeReviveRespawn(player: Player): LaneIndex {
    const playerZ = player.position.z;
    const playerBox = player.collider;
    const currentLane = player.currentLane;

    // 1. Deactivate and clear any lethal obstacle intersecting or immediately adjacent to player
    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        // Check if obstacle directly overlaps player or is within lethal impact zone in the current lane
        const inLethalRange = obs.collider.max.z >= playerZ - 10.0 && obs.collider.min.z <= playerZ + 6.0;
        const inCurrentLane = obs.lane === currentLane;
        const intersects = obs.collider.intersectsBox(playerBox);

        if (intersects || (inLethalRange && inCurrentLane)) {
          obs.active = false;
          chunk.group.remove(obs.group);
        }
      }
    }

    // 2. Evaluate all 3 lanes (-1, 0, 1) for safety in the upcoming 15 meters [playerZ - 15, playerZ]
    const lanes: LaneIndex[] = [-1, 0, 1];
    const laneHazards: Record<LaneIndex, number> = { [-1]: 0, [0]: 0, [1]: 0 };

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;
        const isAhead = obs.collider.max.z >= playerZ - 15.0 && obs.collider.min.z <= playerZ;
        if (isAhead && lanes.includes(obs.lane as LaneIndex)) {
          laneHazards[obs.lane as LaneIndex]++;
        }
      }
    }

    // Prefer current lane if clear; otherwise pick adjacent clear lane
    let chosenLane: LaneIndex = currentLane;
    if (laneHazards[currentLane] > 0) {
      // Find a lane with zero upcoming hazards
      const zeroHazardLanes = lanes.filter(l => laneHazards[l] === 0);
      if (zeroHazardLanes.length > 0) {
        // Pick closest zero hazard lane to current lane
        zeroHazardLanes.sort((a, b) => Math.abs(a - currentLane) - Math.abs(b - currentLane));
        chosenLane = zeroHazardLanes[0];
      } else {
        // If all lanes have obstacles, pick the lane with the fewest hazards and clear runway
        lanes.sort((a, b) => laneHazards[a] - laneHazards[b]);
        chosenLane = lanes[0];
        // Clear obstacles within 10m ahead in that chosen lane to guarantee safe runway
        for (const chunk of this.chunks) {
          for (const obs of chunk.obstacles) {
            if (!obs.active) continue;
            if (obs.lane === chosenLane && obs.collider.max.z >= playerZ - 10.0 && obs.collider.min.z <= playerZ) {
              obs.active = false;
              chunk.group.remove(obs.group);
            }
          }
        }
      }
    }

    this.previousPlayerZ = playerZ;
    return chosenLane;
  }

  /**
   * Compact diagnostics object for developer inspection & testing of rooftop traversal
   */
  public getRooftopTraversalDiagnostics(): Record<string, unknown> {
    const player = this.encounterPlayer;
    const currentSupport = player ? this.findObstacleById(player.getActiveSupportObstacleId() || '') : null;
    const plan = this.activeRooftopPlan;
    const nextTransfer = plan?.transfers[0];

    const pinnedChunkIds = this.chunks
      .filter((c) => {
        if (!player) return false;
        const chunkEndZ = c.chunkZ - CONSTANTS.CHUNK_LENGTH;
        const isSupporting = c.obstacles.some(
          (o) => o.id === player.getActiveSupportObstacleId() ||
                 (Boolean(o.carriageGroupId) && o.carriageGroupId === player.getActiveSupportGroupId()) ||
                 (Boolean(o.routeGroupId) && o.routeGroupId === plan?.id && player.getSupportSurface() !== 'GROUND')
        );
        const isPlayerIn = player.position.z <= c.chunkZ + 2.0 && player.position.z >= chunkEndZ - 2.0;
        return isSupporting || (player.getSupportSurface() !== 'GROUND' && isPlayerIn);
      })
      .map((c) => c.chunkZ);

    return {
      currentSupportSurface: player ? player.getSupportSurface() : 'GROUND',
      currentSupportObstacleId: player ? player.getActiveSupportObstacleId() : null,
      currentSupportGroupId: player ? player.getActiveSupportGroupId() : null,
      activeRooftopRouteId: plan ? plan.id : null,
      routeSeed: plan ? plan.seed : null,
      routeArchetype: plan ? plan.archetype : null,
      difficultyTier: plan ? plan.tier : null,
      currentRouteLeg: currentSupport?.routeLegId || null,
      currentLane: player ? player.currentLane : 0,
      targetLane: nextTransfer ? nextTransfer.targetLane : (player ? player.currentLane : 0),
      playerSpeed: player ? player.speed : 0,
      targetRooftopDuration: plan ? plan.targetDuration : 0,
      measuredRooftopDuration: this.rooftopMeasuredDuration,
      activeRoofSegmentIds: currentSupport?.roofSegments?.map((s) => s.id) || [],
      nextTransferType: nextTransfer ? nextTransfer.kind : null,
      nextTransferWindowStart: nextTransfer ? nextTransfer.windowStartZ : null,
      nextTransferWindowEnd: nextTransfer ? nextTransfer.windowEndZ : null,
      predictedLandingLocation: nextTransfer ? { lane: nextTransfer.targetLane, z: nextTransfer.landingZ } : null,
      validatorResult: plan && player ? ReachabilityValidator.validateRooftopRoute(plan, player.speed, undefined, this.getGameMode()) : null,
      supportLossCount: this.supportLossCount,
      lastSupportLossReason: this.lastSupportLossReason,
      movingSupportDisplacementCurrentFrame: this.lastMovingDisplacement,
      pinnedChunkIds
    };
  }

  /**
   * Forces a deterministic rooftop route archetype and seed for debugging and unit testing
   */
  public setDebugRooftopRoute(archetype: RooftopRouteArchetype, seed: number): void {
    this.forcedDebugArchetype = archetype;
    this.forcedDebugSeed = seed;
  }
}

