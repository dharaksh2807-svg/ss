import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { Player } from '../player/Player';
import { TrackManager } from '../track/TrackManager';
import { TrackChunk } from '../track/TrackChunk';
import { ObstacleType } from '../track/ObstacleFactory';

export interface TrainScenarioConfig {
  trainType: 'TRAIN' | 'MOVING_TRAIN' | 'TRAIN_RAMP';
  trainLength: number;
  hasRamp: boolean;
  trainSpeed?: number;
  playerSpeed?: number;
  playerLane: LaneIndex;
  playerStartY?: number;
  playerStartZ?: number;
  entryState?: 'GROUND_APPROACH' | 'JUMP_LANDING' | 'ROOFTOP_RUN' | 'SLIDE_APPROACH';
  hasHoverboard?: boolean;
  hasSuperSneakers?: boolean;
  fps?: number;
}

export interface ScenarioFrameSnapshot {
  time: number;
  playerZ: number;
  playerY: number;
  groundY: number;
  verticalVelocity: number;
  playerState: string;
  supportSurface: string;
  activeSupportObstacleId: string | null;
  hadCollision: boolean;
  collisionReason?: string;
}

export interface ScenarioOutcome {
  success: boolean;
  climbedRamp: boolean;
  reachedRoof: boolean;
  crashed: boolean;
  reason: string;
  frameCount: number;
  duration: number;
  firstUnexpectedContact?: ScenarioFrameSnapshot;
  trajectory: ScenarioFrameSnapshot[];
}

export class TrainScenarioRunner {
  private static instance: TrainScenarioRunner | null = null;
  private lastConfig: TrainScenarioConfig | null = null;
  private lastOutcome: ScenarioOutcome | null = null;
  private debugUIRoot: HTMLElement | null = null;

  public static getInstance(): TrainScenarioRunner {
    if (!TrainScenarioRunner.instance) {
      TrainScenarioRunner.instance = new TrainScenarioRunner();
    }
    return TrainScenarioRunner.instance;
  }

  /**
   * Sets up and configures a deterministic train scenario on the provided player and trackManager
   */
  public setupScenario(
    player: Player,
    trackManager: TrackManager,
    config: TrainScenarioConfig
  ): void {
    this.lastConfig = { ...config };

    // Reset player state
    player.reset();
    player.currentLane = config.playerLane;
    player.targetLane = config.playerLane;
    if (config.playerSpeed !== undefined) {
      player.speed = config.playerSpeed;
    }
    if (config.hasHoverboard) {
      player.hoverboardManager.activate();
    }
    if (config.hasSuperSneakers) {
      player.powerups.activate('SNEAKERS');
    }

    // Clear existing chunks and populate first chunk with deterministic test train
    const chunk = trackManager.chunks[0];
    chunk.chunkZ = 0;
    chunk.clearDynamicItems();

    const trainZOffset = 30.0;
    const trainType = config.trainType;
    const hasRamp = config.hasRamp || trainType === 'TRAIN_RAMP';

    chunk.populate({
      name: 'DEBUG_TRAIN_SCENARIO',
      difficulty: 'MEDIUM',
      obstacles: [{
        type: trainType as ObstacleType,
        lane: config.playerLane,
        zOffset: trainZOffset,
        length: config.trainLength,
        hasRamp,
        isMoving: trainType === 'MOVING_TRAIN',
        velocityZ: config.trainSpeed || (trainType === 'MOVING_TRAIN' ? CONSTANTS.MOVING_TRAIN_SPEED : 0)
      }],
      collectibles: []
    }, 0);

    // Initial position based on entry state
    const halfD = config.trainLength * 0.5;
    const trainFrontZ = -trainZOffset + halfD; // Center is at -30, front is at -30 + halfD

    const startLaneX = CONSTANTS.LANES[config.playerLane];

    if (config.entryState === 'GROUND_APPROACH' || !config.entryState) {
      // Start 5 meters in front of ramp (or front bumper)
      const rampD = hasRamp ? CONSTANTS.TRAIN_RAMP_LENGTH : 0;
      const startZ = config.playerStartZ !== undefined ? config.playerStartZ : (trainFrontZ + rampD + 5.0);
      player.position.set(startLaneX, CONSTANTS.PLAYER_BASE_Y, startZ);
      player.previousPosition.copy(player.position);
      player.state = 'RUN';
      player.setSupportSurface('GROUND', null);
    } else if (config.entryState === 'JUMP_LANDING') {
      // Descending from jump onto roof
      const startZ = config.playerStartZ !== undefined ? config.playerStartZ : (trainFrontZ - halfD * 0.5);
      player.position.set(startLaneX, config.playerStartY || 5.2, startZ);
      player.previousPosition.set(startLaneX, 5.6, startZ + 1.0);
      player.isJumping = true;
      player.state = 'FALLING';
      player.verticalVelocity = -8.0;
    } else if (config.entryState === 'ROOFTOP_RUN') {
      // Running directly on roof
      const startZ = config.playerStartZ !== undefined ? config.playerStartZ : (trainFrontZ - 2.0);
      player.position.set(startLaneX, 4.35, startZ);
      player.previousPosition.copy(player.position);
      player.resolveRoofLanding(4.35, chunk.obstacles[0]?.id);
    } else if (config.entryState === 'SLIDE_APPROACH') {
      const rampD = hasRamp ? CONSTANTS.TRAIN_RAMP_LENGTH : 0;
      const startZ = config.playerStartZ !== undefined ? config.playerStartZ : (trainFrontZ + rampD + 3.0);
      player.position.set(startLaneX, CONSTANTS.PLAYER_BASE_Y, startZ);
      player.previousPosition.copy(player.position);
      player.slide();
    }

    player.updateCollider();
  }

  /**
   * Executes a deterministic simulation of the configured scenario
   */
  public runScenario(
    player: Player,
    trackManager: TrackManager,
    config: TrainScenarioConfig,
    maxDuration: number = 2.0
  ): ScenarioOutcome {
    this.setupScenario(player, trackManager, config);

    const fps = config.fps || 60;
    const dt = 1.0 / fps;
    let elapsed = 0;
    let frameCount = 0;
    const trajectory: ScenarioFrameSnapshot[] = [];
    let climbedRamp = false;
    let reachedRoof = false;
    let crashed = false;
    let reason = 'DURATION_ELAPSED';
    let firstUnexpectedContact: ScenarioFrameSnapshot | undefined;

    while (elapsed < maxDuration) {
      player.update(dt);
      trackManager.update(player, dt, elapsed);
      elapsed += dt;
      frameCount++;

      const snapshot: ScenarioFrameSnapshot = {
        time: elapsed,
        playerZ: player.position.z,
        playerY: player.position.y,
        groundY: player.groundY,
        verticalVelocity: player.verticalVelocity,
        playerState: player.state,
        supportSurface: player.getSupportSurface(),
        activeSupportObstacleId: player.getActiveSupportObstacleId(),
        hadCollision: player.state === 'CRASH'
      };

      trajectory.push(snapshot);

      if (player.getSupportSurface() === 'RAMP' || player.state === 'CLIMBING') {
        climbedRamp = true;
      }
      if (player.getSupportSurface() === 'TRAIN_ROOF' || player.state === 'ON_TRAIN') {
        reachedRoof = true;
      }
      if (player.state === 'CRASH') {
        crashed = true;
        snapshot.collisionReason = 'CRASH';
        if (!firstUnexpectedContact) {
          firstUnexpectedContact = snapshot;
        }
        reason = 'FATAL_CRASH';
        break;
      }
    }

    const hasRamp = config.hasRamp || config.trainType === 'TRAIN_RAMP';
    let success = false;
    if (hasRamp && config.entryState !== 'SLIDE_APPROACH') {
      success = reachedRoof && !crashed;
      if (success) reason = 'SUCCESSFUL_RAMP_CLIMB';
    } else if (!hasRamp) {
      // Non-ramp train: should crash if head-on
      success = crashed;
      if (success) reason = 'EXPECTED_LETHAL_FRONTAL_COLLISION';
    } else {
      success = !crashed;
    }

    this.lastOutcome = {
      success,
      climbedRamp,
      reachedRoof,
      crashed,
      reason,
      frameCount,
      duration: elapsed,
      firstUnexpectedContact,
      trajectory
    };

    return this.lastOutcome;
  }

  public getLastOutcome(): ScenarioOutcome | null {
    return this.lastOutcome;
  }

  public getLastConfig(): TrainScenarioConfig | null {
    return this.lastConfig;
  }

  /**
   * Binds debugging APIs to global window object when in development environment
   */
  public attachToWindow(game: any): void {
    if (typeof window === 'undefined') return;

    (window as any).__TRAIN_SCENARIO_RUNNER__ = {
      runScenario: (config: TrainScenarioConfig, maxDuration?: number) => {
        return this.runScenario(game.getPlayer(), game.getTrackManager(), config, maxDuration);
      },
      replayScenario: (maxDuration?: number) => {
        if (!this.lastConfig) return null;
        return this.runScenario(game.getPlayer(), game.getTrackManager(), this.lastConfig, maxDuration);
      },
      getLastOutcome: () => this.getLastOutcome(),
      getLastConfig: () => this.getLastConfig()
    };
  }
}
