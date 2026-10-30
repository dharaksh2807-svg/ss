import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { Player } from '../player/Player';
import { TrackManager } from '../track/TrackManager';
import { CameraController } from '../scene/CameraController';
import { ObstacleType, ObstacleInstance } from '../track/ObstacleFactory';
import { InputAction } from '../core/InputManager';
import { EventBus, EVENTS } from '../core/EventBus';
import { BugSnapshotPackage, BugSnapshotFrame } from './BugSnapshotTypes';

export interface ReproductionStatus {
  isActive: boolean;
  elapsedTime: number;
  duration: number;
  inputIndex: number;
  totalInputs: number;
  outcomeObserved: boolean;
  outcomeReason: string;
  isVerified: boolean;
}

export class BugReproductionLoader {
  private static instance: BugReproductionLoader | null = null;

  private activeSnapshot: BugSnapshotPackage | null = null;
  private isActive: boolean = false;
  private reproductionElapsed: number = 0;
  private reproductionDuration: number = 4.0;
  private nextInputIndex: number = 0;
  private scheduledInputs: Array<{ relativeTime: number; action: InputAction }> = [];

  private outcomeObserved: boolean = false;
  private outcomeReason: string = '';
  private isVerified: boolean = false;

  private onCompleteCallback: ((verified: boolean, reason: string) => void) | null = null;
  private eventBus = EventBus.getInstance();

  private constructor() {
    this.setupListeners();
  }

  public static getInstance(): BugReproductionLoader {
    if (!BugReproductionLoader.instance) {
      BugReproductionLoader.instance = new BugReproductionLoader();
    }
    return BugReproductionLoader.instance;
  }

  private setupListeners(): void {
    this.eventBus.on(EVENTS.CRASH, () => {
      if (this.isActive) {
        this.outcomeObserved = true;
        this.outcomeReason = 'CRASH';
        this.checkVerification();
      }
    });

    this.eventBus.on(EVENTS.STUMBLE, () => {
      if (this.isActive) {
        this.outcomeObserved = true;
        this.outcomeReason = 'STUMBLE';
        this.checkVerification();
      }
    });

    this.eventBus.on(EVENTS.HOVERBOARD_BROKEN, () => {
      if (this.isActive) {
        this.outcomeObserved = true;
        this.outcomeReason = 'HOVERBOARD_ABSORPTION';
        this.checkVerification();
      }
    });
  }

  /**
   * Loads a bug snapshot package into a fully sandboxed deterministic environment.
   * STRICT GUARANTEE: Does NOT mutate player wallet, currencies, high scores, or missions!
   */
  public loadSnapshot(
    snapshot: BugSnapshotPackage,
    player: Player,
    trackManager: TrackManager,
    cameraController?: CameraController,
    onComplete?: (verified: boolean, reason: string) => void
  ): boolean {
    if (!snapshot || !snapshot.frames || snapshot.frames.length === 0) {
      console.warn('[BugReproductionLoader] Cannot reproduce empty or malformed snapshot');
      return false;
    }

    this.activeSnapshot = snapshot;
    this.isActive = true;
    this.reproductionElapsed = 0;
    this.nextInputIndex = 0;
    this.outcomeObserved = false;
    this.outcomeReason = '';
    this.isVerified = false;
    this.onCompleteCallback = onComplete || null;

    const firstFrame = snapshot.frames[0];
    const lastFrame = snapshot.frames[snapshot.frames.length - 1];

    this.reproductionDuration = Math.max(1.5, Math.min(6.0, lastFrame.simTime - firstFrame.simTime + 0.5));

    // 1. Configure Track Determinism
    const seed = snapshot.runContext.seed || 1337;
    trackManager.setSeed(seed, true);

    // 2. Clear Chunk 0 and populate obstacle encounters from snapshot
    const chunk = trackManager.chunks[0];
    chunk.chunkZ = 0;
    chunk.clearDynamicItems();

    // Recreate nearby obstacles from snapshot if present
    const nearbyObstacles = lastFrame.nearbyObstacles || [];
    const populatedObstacles: any[] = [];

    for (const obs of nearbyObstacles) {
      const zOffset = Math.abs(obs.z - firstFrame.player.z);
      populatedObstacles.push({
        type: obs.type,
        lane: obs.lane,
        zOffset: Math.max(5.0, zOffset),
        hasRamp: obs.hasRamp,
        isMoving: obs.velocityZ !== undefined && Math.abs(obs.velocityZ) > 0.1,
        velocityZ: obs.velocityZ || 0,
        length: obs.depth || CONSTANTS.TRAIN_LENGTH_SHORT
      });
    }

    if (populatedObstacles.length > 0) {
      chunk.populate(
        {
          name: `REPRO_${snapshot.trigger.type}`,
          difficulty: 'MEDIUM',
          obstacles: populatedObstacles,
          collectibles: []
        },
        0
      );
    }

    // 3. Configure Player Initial State
    player.reset();
    player.currentLane = firstFrame.player.lane;
    player.targetLane = firstFrame.player.targetLane;
    player.speed = firstFrame.player.speed || CONSTANTS.INITIAL_SPEED;
    player.position.set(firstFrame.player.x, firstFrame.player.y, 0);
    player.previousPosition.copy(player.position);
    player.groundY = firstFrame.player.groundY;
    player.supportSurface = firstFrame.player.supportSurface;
    player.activeSupportObstacleId = firstFrame.player.activeSupportObstacleId;

    if (firstFrame.powerups.hasHoverboard && player.hoverboardManager) {
      player.hoverboardManager.grantPracticeCharge();
      player.hoverboardManager.activate();
    }
    if (firstFrame.powerups.hasShield && player.powerups) {
      player.powerups.activate('SHIELD');
    }
    if (firstFrame.powerups.hasSneakers && player.powerups) {
      player.powerups.activate('SNEAKERS');
    }

    player.updateCollider();

    // 4. Compute Relative Input Timestamps
    const baseTime = firstFrame.timestamp || (snapshot.inputs[0]?.time || 0);
    this.scheduledInputs = (snapshot.inputs || []).map(inp => ({
      relativeTime: Math.max(0, inp.time - baseTime),
      action: inp.action
    }));
    this.scheduledInputs.sort((a, b) => a.relativeTime - b.relativeTime);

    // 5. Enable 3D Collision Visualizer Wireframes for Diagnostics
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG_COLLIDERS__ = true;
    }

    if (cameraController) {
      cameraController.reset(player.position);
    }

    this.eventBus.emit('REPRODUCTION_STARTED', {
      trigger: snapshot.trigger.type,
      seed,
      inputCount: this.scheduledInputs.length
    });

    return true;
  }

  /**
   * Steps the reproduction simulation and dispatches scheduled inputs
   */
  public update(dt: number, player: Player): void {
    if (!this.isActive) return;

    this.reproductionElapsed += dt;

    // Dispatch scheduled player inputs
    while (
      this.nextInputIndex < this.scheduledInputs.length &&
      this.scheduledInputs[this.nextInputIndex].relativeTime <= this.reproductionElapsed
    ) {
      const scheduled = this.scheduledInputs[this.nextInputIndex];
      player.handleInput(scheduled.action);
      this.eventBus.emit('REPRODUCTION_INPUT_DISPATCHED', scheduled);
      this.nextInputIndex++;
    }

    // Check timeout / completion
    if (this.reproductionElapsed >= this.reproductionDuration) {
      this.finishReproduction();
    }
  }

  private checkVerification(): void {
    if (!this.activeSnapshot) return;

    const expectedTrigger = this.activeSnapshot.trigger.type;
    if (
      (expectedTrigger === 'FATAL_COLLISION' && this.outcomeReason === 'CRASH') ||
      (expectedTrigger === 'ROOFTOP_CLIPPING_OR_FALL' && this.outcomeReason === 'CRASH') ||
      (expectedTrigger === 'INVALID_PHYSICS' && this.outcomeObserved) ||
      (expectedTrigger === 'MANUAL_TRIGGER' && this.reproductionElapsed > 0.5)
    ) {
      this.isVerified = true;
    }
  }

  public finishReproduction(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.checkVerification();

    const verified = this.isVerified;
    const reason = this.outcomeReason || (verified ? 'VERIFIED_REPRODUCTION' : 'COMPLETED_WITHOUT_FAILURE');

    if (this.onCompleteCallback) {
      this.onCompleteCallback(verified, reason);
    }

    this.eventBus.emit('REPRODUCTION_FINISHED', {
      verified,
      reason,
      elapsed: this.reproductionElapsed
    });
  }

  public stop(): void {
    this.isActive = false;
  }

  public isRunning(): boolean {
    return this.isActive;
  }

  public getStatus(): ReproductionStatus {
    return {
      isActive: this.isActive,
      elapsedTime: Math.round(this.reproductionElapsed * 100) / 100,
      duration: Math.round(this.reproductionDuration * 100) / 100,
      inputIndex: this.nextInputIndex,
      totalInputs: this.scheduledInputs.length,
      outcomeObserved: this.outcomeObserved,
      outcomeReason: this.outcomeReason,
      isVerified: this.isVerified
    };
  }

  public getActiveSnapshot(): BugSnapshotPackage | null {
    return this.activeSnapshot;
  }
}
