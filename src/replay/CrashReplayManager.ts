import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { Player, PlayerState } from '../player/Player';
import { ObstacleInstance, ObstacleType } from '../track/ObstacleFactory';
import { CameraController } from '../scene/CameraController';
import { ChaserModel } from '../characters/ChaserModel';
import { CollisionDiagnostic } from '../track/CollisionTypes';
import { EventBus, EVENTS } from '../core/EventBus';

export type DeathCategory =
  | 'TRAIN_FRONTAL'
  | 'TRAIN_FLANK'
  | 'TRAIN_ROOF_MISSED'
  | 'LOW_BARRIER'
  | 'HIGH_BARRIER'
  | 'PILLAR'
  | 'CHASER_CAPTURE'
  | 'EXPIRED_PROTECTION'
  | 'GENERAL_COLLISION';

export interface DeathExplanation {
  headline: string;
  explanation: string;
  proTip: string;
  icon: string;
  category: DeathCategory;
}

export interface ReplayObstacleSnapshot {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  z: number;
  rotY?: number;
  velocityZ?: number;
}

export interface ReplayFrame {
  time: number;
  player: {
    x: number;
    y: number;
    z: number;
    rotY: number;
    lane: LaneIndex;
    state: PlayerState;
    isJumping: boolean;
    isSliding: boolean;
    speed: number;
    groundY: number;
  };
  camera: {
    posX: number;
    posY: number;
    posZ: number;
    rotX: number;
    rotY: number;
    rotZ: number;
    fov: number;
  };
  chaser?: {
    x: number;
    y: number;
    z: number;
    state: string;
  };
  obstacles: ReplayObstacleSnapshot[];
  protection: {
    hasShield: boolean;
    hasHoverboard: boolean;
    isInvulnerable: boolean;
  };
}

export interface FatalCollisionMetadata {
  timestamp: number;
  reason: string;
  obstacleId?: string;
  obstacleType?: ObstacleType;
  collisionType?: string;
  isFrontal?: boolean;
  isFlankContact?: boolean;
  isGlance?: boolean;
  contactPosition?: { x: number; y: number; z: number };
  relativeVelocity?: { x: number; y: number; z: number };
  playerSpeedAtImpact: number;
  playerStateAtImpact: PlayerState;
  playerLaneAtImpact: LaneIndex;
  playerGroundY: number;
  playerYAtImpact: number;
  activeProtectionBeforeImpact: {
    hasShield: boolean;
    hasHoverboard: boolean;
    isInvulnerable: boolean;
  };
  expiredProtectionRecent?: boolean;
}

export interface ActiveCrashAnalysis {
  metadata: FatalCollisionMetadata;
  explanation: DeathExplanation;
  frames: ReplayFrame[];
  impactFrameIndex: number;
  duration: number;
}

export class CrashReplayManager {
  private static instance: CrashReplayManager | null = null;

  // Bounded circular buffer: ~4.0 seconds at 60 FPS (240 frames)
  public static readonly MAX_BUFFER_FRAMES = 240;
  private buffer: Array<ReplayFrame | null> = new Array(CrashReplayManager.MAX_BUFFER_FRAMES).fill(null);
  private head: number = 0;
  private count: number = 0;

  // Active fatal analysis & frozen replay interval
  private activeAnalysis: ActiveCrashAnalysis | null = null;

  // Playback state
  private isReplaying: boolean = false;
  private playbackElapsed: number = 0;
  private playbackDuration: number = 3.2; // total replay seconds
  private slowMoStartProgress: number = 0.58; // point where slow motion begins (58% through clip)
  private minTimeScale: number = 0.38; // slowest rate near impact point
  private savedPlayerTransform: { x: number; y: number; z: number; rotY: number; state: PlayerState } | null = null;
  private savedCameraTransform: { posX: number; posY: number; posZ: number; rotX: number; rotY: number; rotZ: number; fov: number } | null = null;

  private eventBus = EventBus.getInstance();

  private constructor() {}

  public static getInstance(): CrashReplayManager {
    if (!CrashReplayManager.instance) {
      CrashReplayManager.instance = new CrashReplayManager();
    }
    return CrashReplayManager.instance;
  }

  /**
   * Records a single lightweight snapshot into the circular buffer during PLAYING state.
   * Completely avoids copying meshes, GPU buffers, or full scenes.
   */
  public recordFrame(
    player: Player,
    cameraController: CameraController,
    nearbyObstacles: ObstacleInstance[] = [],
    chaser: ChaserModel | null = null,
    nowTime: number = typeof performance !== 'undefined' ? performance.now() / 1000 : 0
  ): void {
    if (this.isReplaying) return;

    // Filter nearby active obstacles within relevant camera and interaction distance [-35m, +15m]
    const playerZ = player.position.z;
    const obsSnapshots: ReplayObstacleSnapshot[] = [];
    for (let i = 0; i < nearbyObstacles.length; i++) {
      const obs = nearbyObstacles[i];
      if (!obs.active) continue;
      const obsZ = obs.group.position.z;
      if (obsZ >= playerZ - 35 && obsZ <= playerZ + 15) {
        obsSnapshots.push({
          id: obs.id,
          type: obs.type,
          x: obs.group.position.x,
          y: obs.group.position.y,
          z: obsZ,
          rotY: obs.group.rotation.y,
          velocityZ: obs.velocityZ
        });
      }
    }

    const frame: ReplayFrame = {
      time: nowTime,
      player: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        rotY: player.mesh.rotation.y,
        lane: player.currentLane,
        state: player.state,
        isJumping: player.isJumping,
        isSliding: player.isSliding,
        speed: player.speed,
        groundY: player.groundY
      },
      camera: {
        posX: cameraController.camera.position.x,
        posY: cameraController.camera.position.y,
        posZ: cameraController.camera.position.z,
        rotX: cameraController.camera.rotation.x,
        rotY: cameraController.camera.rotation.y,
        rotZ: cameraController.camera.rotation.z,
        fov: cameraController.camera.fov
      },
      chaser: chaser ? {
        x: chaser.mesh.position.x,
        y: chaser.mesh.position.y,
        z: chaser.mesh.position.z,
        state: chaser.getChaseState()
      } : undefined,
      obstacles: obsSnapshots,
      protection: {
        hasShield: player.powerups.hasShieldActive(),
        hasHoverboard: player.hoverboardManager.isBoardActive(),
        isInvulnerable: player.isInvulnerable()
      }
    };

    this.buffer[this.head] = frame;
    this.head = (this.head + 1) % CrashReplayManager.MAX_BUFFER_FRAMES;
    if (this.count < CrashReplayManager.MAX_BUFFER_FRAMES) {
      this.count++;
    }
  }

  /**
   * Freezes authoritative replay interval and generates intelligent death explanation.
   */
  public recordFatalCrash(params: {
    reason: string;
    obstacle?: ObstacleInstance | null;
    diagnostic?: CollisionDiagnostic | null;
    player: Player;
    chaser?: ChaserModel | null;
    isFrontal?: boolean;
    isFlankContact?: boolean;
    isGlance?: boolean;
  }): ActiveCrashAnalysis {
    const {
      reason,
      obstacle,
      diagnostic,
      player,
      chaser,
      isFrontal = true,
      isFlankContact = false,
      isGlance = false
    } = params;

    const protectionState = {
      hasShield: player.powerups.hasShieldActive(),
      hasHoverboard: player.hoverboardManager.isBoardActive(),
      isInvulnerable: player.isInvulnerable()
    };

    const metadata: FatalCollisionMetadata = {
      timestamp: diagnostic?.timestamp || (typeof performance !== 'undefined' ? performance.now() : Date.now()),
      reason,
      obstacleId: obstacle?.id || diagnostic?.obstacleId,
      obstacleType: obstacle?.type || (diagnostic?.collisionType as ObstacleType),
      collisionType: diagnostic?.collisionType || obstacle?.type || reason,
      isFrontal: isFrontal !== undefined ? isFrontal : !isFlankContact,
      isFlankContact: isFlankContact,
      isGlance: isGlance,
      contactPosition: diagnostic?.contactPosition || { x: player.position.x, y: player.position.y, z: player.position.z },
      relativeVelocity: diagnostic?.relativeVelocity || { x: 0, y: player.verticalVelocity, z: -player.speed },
      playerSpeedAtImpact: player.speed,
      playerStateAtImpact: player.state,
      playerLaneAtImpact: player.currentLane,
      playerGroundY: player.groundY,
      playerYAtImpact: player.position.y,
      activeProtectionBeforeImpact: protectionState
    };

    const explanation = this.generateDeathExplanation(metadata);

    // Extract ordered historical frames from circular buffer
    const chronologicalFrames: ReplayFrame[] = [];
    if (this.count > 0) {
      const startIndex = this.count < CrashReplayManager.MAX_BUFFER_FRAMES
        ? 0
        : this.head; // oldest frame
      for (let i = 0; i < this.count; i++) {
        const idx = (startIndex + i) % CrashReplayManager.MAX_BUFFER_FRAMES;
        const f = this.buffer[idx];
        if (f) chronologicalFrames.push(f);
      }
    }

    // Capture the final ~2.8 to 3.2 seconds (max ~180 frames) leading to impact
    const maxReplayFrames = Math.min(chronologicalFrames.length, 180);
    const replaySlice = chronologicalFrames.slice(chronologicalFrames.length - maxReplayFrames);

    this.activeAnalysis = {
      metadata,
      explanation,
      frames: replaySlice,
      impactFrameIndex: Math.max(0, replaySlice.length - 1),
      duration: Math.max(1.5, Math.min(3.5, replaySlice.length / 50.0))
    };

    this.playbackDuration = this.activeAnalysis.duration;
    return this.activeAnalysis;
  }

  /**
   * Deterministically generates an accurate, intelligent death explanation based on collision metadata.
   */
  public generateDeathExplanation(meta: FatalCollisionMetadata): DeathExplanation {
    const {
      reason,
      obstacleType,
      isFrontal = true,
      isFlankContact = false,
      isGlance = false,
      playerStateAtImpact,
      playerYAtImpact,
      playerGroundY,
      playerSpeedAtImpact
    } = meta;

    const spdStr = `${Math.round(playerSpeedAtImpact)} m/s`;

    // 1. Guard Capture
    if (reason === 'CHASER_CAPTURE') {
      return {
        category: 'CHASER_CAPTURE',
        icon: '👮‍♂️',
        headline: 'BUSTED BY TRANSIT SECURITY',
        explanation: 'Captured by Officer Thorne after losing momentum from consecutive obstacles.',
        proTip: 'Avoid stumbling into barriers or walls to keep Officer Thorne at a safe distance.'
      };
    }

    // 2. Failed Rooftop Landing
    // Player attempted to jump onto or between train rooftops but undershot height or fell short
    const isTrainFamily = obstacleType === 'TRAIN' || obstacleType === 'MOVING_TRAIN' ||
                          obstacleType === 'TRAIN_RAMP' || obstacleType === 'TRAIN_COMPOSITION';
    const trainRoofY = CONSTANTS.TRAIN_HEIGHT + 0.15; // 4.35m
    const wasAirborneAttempt = playerStateAtImpact === 'JUMP' || playerYAtImpact > 1.25;

    if (isTrainFamily && wasAirborneAttempt && playerYAtImpact < trainRoofY - 0.25) {
      return {
        category: 'TRAIN_ROOF_MISSED',
        icon: '⚠️',
        headline: 'MISSED ROOFTOP LANDING',
        explanation: `Missed the train rooftop landing. Undershot the height required to clear the carriage roof (${playerYAtImpact.toFixed(1)}m vs ${trainRoofY.toFixed(1)}m).`,
        proTip: 'Use Super Sneakers, high jump ramps, or jump earlier to ensure clean rooftop clearance.'
      };
    }

    // 3. Moving Express Train Collisions
    if (obstacleType === 'MOVING_TRAIN') {
      if (isFlankContact || isGlance) {
        return {
          category: 'TRAIN_FLANK',
          icon: '🚆',
          headline: 'MOVING TRAIN SIDE IMPACT',
          explanation: `Sideswiped an oncoming express train while switching lanes at ${spdStr}.`,
          proTip: 'Ensure your destination track is completely clear before switching beside moving trains.'
        };
      } else {
        return {
          category: 'TRAIN_FRONTAL',
          icon: '🚆',
          headline: 'HEAD-ON TRAIN COLLISION',
          explanation: `Hit an oncoming express train head-on at high combined velocity (${spdStr}).`,
          proTip: 'Watch for flashing headlight beams in the distance and switch tracks before the train arrives.'
        };
      }
    }

    // 4. Stationary Metro Train Collisions
    if (isTrainFamily || reason === 'TRAIN_COLLISION') {
      if (isFlankContact || isGlance) {
        return {
          category: 'TRAIN_FLANK',
          icon: '🚇',
          headline: 'TRAIN CARRIAGE SIDE IMPACT',
          explanation: `Crashed into the flank of a parked metro train carriage while changing lanes.`,
          proTip: 'Center your lane switches cleanly to remain clear of train carriage edges.'
        };
      } else {
        return {
          category: 'TRAIN_FRONTAL',
          icon: '🚇',
          headline: 'STATIONARY TRAIN CRASH',
          explanation: `Crashed directly into a parked metro train at ${spdStr}.`,
          proTip: 'Look for sloped diamond-plate ramps to climb onto rooftops or switch to an open lane.'
        };
      }
    }

    // 5. Low Barrier / Hurdle
    if (obstacleType === 'LOW_BARRIER') {
      return {
        category: 'LOW_BARRIER',
        icon: '🚧',
        headline: 'TRIPPED ON TRACK HURDLE',
        explanation: 'Tripped over a low railway barrier without jumping.',
        proTip: 'Swipe UP or press Spacebar / W to jump cleanly over low track hurdles.'
      };
    }

    // 6. High Barrier / Overhead Arch
    if (obstacleType === 'HIGH_BARRIER' || obstacleType === 'TUNNEL_ARCH') {
      if (wasAirborneAttempt) {
        return {
          category: 'HIGH_BARRIER',
          icon: '⚠️',
          headline: 'JUMPED INTO OVERHEAD BARRIER',
          explanation: 'Jumped directly into an overhead signal arch barrier.',
          proTip: 'Never jump into overhead arches — swipe DOWN or press S to slide underneath!'
        };
      } else {
        return {
          category: 'HIGH_BARRIER',
          icon: '⚠️',
          headline: 'OVERHEAD BARRIER IMPACT',
          explanation: 'Failed to slide underneath an overhead railway barrier.',
          proTip: 'Swipe DOWN or press S / Down Arrow to slide under overhead barriers.'
        };
      }
    }

    // 7. Structural Pillar
    if (obstacleType === 'PILLAR') {
      return {
        category: 'PILLAR',
        icon: '🏛️',
        headline: 'STRUCTURAL PILLAR COLLISION',
        explanation: `Crashed head-on into an elevated track support pillar at ${spdStr}.`,
        proTip: 'Pillars split track pathways — choose the left or right lane well in advance.'
      };
    }

    // 8. Expired Protection
    if (meta.expiredProtectionRecent) {
      return {
        category: 'EXPIRED_PROTECTION',
        icon: '🛡️',
        headline: 'EXPIRED PROTECTION IMPACT',
        explanation: 'Collided with an obstacle immediately after protective shield or hoverboard expired.',
        proTip: 'Monitor your power-up timers on the HUD to know when your protection is about to run out.'
      };
    }

    // 9. Neutral Fallback
    return {
      category: 'GENERAL_COLLISION',
      icon: '💥',
      headline: 'FATAL TRACK COLLISION',
      explanation: `Fatal collision with an obstacle on the railway tracks at ${spdStr}.`,
      proTip: 'Stay focused, switch lanes early, and use hoverboards for crash insurance!'
    };
  }

  /**
   * Starts instant slow-motion replay playback.
   */
  public startPlayback(player: Player, cameraController: CameraController): boolean {
    if (!this.activeAnalysis || this.activeAnalysis.frames.length < 5) {
      return false;
    }

    // Save initial resting game over transforms so we can restore them cleanly
    this.savedPlayerTransform = {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z,
      rotY: player.mesh.rotation.y,
      state: player.state
    };

    this.savedCameraTransform = {
      posX: cameraController.camera.position.x,
      posY: cameraController.camera.position.y,
      posZ: cameraController.camera.position.z,
      rotX: cameraController.camera.rotation.x,
      rotY: cameraController.camera.rotation.y,
      rotZ: cameraController.camera.rotation.z,
      fov: cameraController.camera.fov
    };

    this.isReplaying = true;
    this.playbackElapsed = 0;
    this.playbackDuration = this.activeAnalysis.duration;
    this.eventBus.emit('REPLAY_PLAYBACK_STARTED');
    return true;
  }

  /**
   * Advances replay timeline with smooth dynamic slow-mo curve approaching impact.
   * Frame rate independent.
   */
  public updatePlayback(
    dt: number,
    player: Player,
    cameraController: CameraController,
    chaser?: ChaserModel | null
  ): boolean {
    if (!this.isReplaying || !this.activeAnalysis) return false;

    const totalDuration = this.playbackDuration;
    const progress = Math.min(1.0, this.playbackElapsed / totalDuration);

    // Compute dynamic time dilation (1.0x -> 0.38x slow motion as we approach impact)
    let currentSpeed = 1.0;
    if (progress >= this.slowMoStartProgress) {
      const slowPhase = (progress - this.slowMoStartProgress) / (1.0 - this.slowMoStartProgress);
      // Smooth cosine ease down to 0.38x
      currentSpeed = 1.0 - (1.0 - this.minTimeScale) * Math.sin(slowPhase * (Math.PI / 2));
    }

    this.playbackElapsed += dt * currentSpeed;

    const frames = this.activeAnalysis.frames;
    const frameCount = frames.length;
    if (frameCount === 0) return false;

    // Map progress to floating frame index
    const targetFramePos = Math.min(frameCount - 1, progress * (frameCount - 1));
    const baseIndex = Math.floor(targetFramePos);
    const nextIndex = Math.min(frameCount - 1, baseIndex + 1);
    const alpha = targetFramePos - baseIndex;

    const fA = frames[baseIndex];
    const fB = frames[nextIndex];

    if (fA && fB) {
      // 1. Interpolate Player Pose & Animation
      const px = fA.player.x + (fB.player.x - fA.player.x) * alpha;
      const py = fA.player.y + (fB.player.y - fA.player.y) * alpha;
      const pz = fA.player.z + (fB.player.z - fA.player.z) * alpha;
      const pRotY = fA.player.rotY + (fB.player.rotY - fA.player.rotY) * alpha;

      player.position.set(px, py, pz);
      player.mesh.position.set(px, py, pz);
      player.mesh.rotation.y = pRotY;

      // Update character model visual pose without triggering audio or gameplay score
      const activeState = progress >= 0.96 ? 'CRASH' : (alpha > 0.5 ? fB.player.state : fA.player.state);
      player.state = activeState;
      if (player.model) {
        player.model.updateAnimation(activeState, player.speed, 0, player.groundY, dt, 'NONE', 0, 0, 0, false);
      }

      // 2. Interpolate Camera Pose (Stable perspective framing runner & impending obstacle)
      const cx = fA.camera.posX + (fB.camera.posX - fA.camera.posX) * alpha;
      const cy = fA.camera.posY + (fB.camera.posY - fA.camera.posY) * alpha;
      const cz = fA.camera.posZ + (fB.camera.posZ - fA.camera.posZ) * alpha;
      const cFov = fA.camera.fov + (fB.camera.fov - fA.camera.fov) * alpha;

      cameraController.camera.position.set(cx, cy, cz);
      cameraController.camera.rotation.set(
        fA.camera.rotX + (fB.camera.rotX - fA.camera.rotX) * alpha,
        fA.camera.rotY + (fB.camera.rotY - fA.camera.rotY) * alpha,
        fA.camera.rotZ + (fB.camera.rotZ - fA.camera.rotZ) * alpha
      );
      cameraController.camera.fov = cFov;
      cameraController.camera.updateProjectionMatrix();

      // 3. Interpolate Chaser if active
      if (chaser && fA.chaser && fB.chaser) {
        const chX = fA.chaser.x + (fB.chaser.x - fA.chaser.x) * alpha;
        const chY = fA.chaser.y + (fB.chaser.y - fA.chaser.y) * alpha;
        const chZ = fA.chaser.z + (fB.chaser.z - fA.chaser.z) * alpha;
        chaser.mesh.position.set(chX, chY, chZ);
      }
    }

    // Playback finished check (hold impact for 0.7s at end)
    if (this.playbackElapsed >= totalDuration + 0.7) {
      this.eventBus.emit('REPLAY_PLAYBACK_FINISHED');
      return true;
    }

    return false;
  }

  /**
   * Stops replay and restores saved game over resting state.
   */
  public stopPlayback(player: Player, cameraController: CameraController): void {
    this.isReplaying = false;

    // Restore saved resting transforms
    if (this.savedPlayerTransform) {
      player.position.set(
        this.savedPlayerTransform.x,
        this.savedPlayerTransform.y,
        this.savedPlayerTransform.z
      );
      player.mesh.position.copy(player.position);
      player.mesh.rotation.y = this.savedPlayerTransform.rotY;
      player.state = this.savedPlayerTransform.state;
      if (player.model) {
        player.model.updateAnimation(this.savedPlayerTransform.state, 0, 0, player.groundY, 0.016, 'NONE', 0, 0, 0, false);
      }
    }

    if (this.savedCameraTransform) {
      cameraController.camera.position.set(
        this.savedCameraTransform.posX,
        this.savedCameraTransform.posY,
        this.savedCameraTransform.posZ
      );
      cameraController.camera.rotation.set(
        this.savedCameraTransform.rotX,
        this.savedCameraTransform.rotY,
        this.savedCameraTransform.rotZ
      );
      cameraController.camera.fov = this.savedCameraTransform.fov;
      cameraController.camera.updateProjectionMatrix();
    }

    this.eventBus.emit('REPLAY_PLAYBACK_STOPPED');
  }

  /**
   * Resets playback and clears buffer for a fresh run.
   */
  public reset(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.count = 0;
    this.activeAnalysis = null;
    this.isReplaying = false;
    this.playbackElapsed = 0;
    this.savedPlayerTransform = null;
    this.savedCameraTransform = null;
  }

  public clear(): void {
    this.reset();
  }

  public getActiveAnalysis(): ActiveCrashAnalysis | null {
    return this.activeAnalysis;
  }

  public getActiveExplanation(): DeathExplanation | null {
    return this.activeAnalysis?.explanation || null;
  }

  public hasReplayData(): boolean {
    return this.activeAnalysis !== null && this.activeAnalysis.frames.length >= 10;
  }

  public isReplayActive(): boolean {
    return this.isReplaying;
  }

  public getPlaybackProgress(): number {
    if (!this.playbackDuration || this.playbackDuration <= 0) return 0;
    return Math.max(0, Math.min(1.0, this.playbackElapsed / this.playbackDuration));
  }

  public getPlaybackElapsed(): number {
    return this.playbackElapsed;
  }

  public getPlaybackDuration(): number {
    return this.playbackDuration;
  }

  public getBufferSize(): number {
    return this.count;
  }

  public getBufferCount(): number {
    return this.count;
  }

  public hasSufficientReplayData(): boolean {
    return this.count >= 10;
  }

  public isPlaybackActive(): boolean {
    return this.isReplaying;
  }

  public getCurrentTimeScale(): number {
    if (!this.isReplaying || !this.playbackDuration || this.playbackDuration <= 0) return 1.0;
    const progress = Math.min(1.0, this.playbackElapsed / this.playbackDuration);
    if (progress >= this.slowMoStartProgress) {
      const slowPhase = (progress - this.slowMoStartProgress) / (1.0 - this.slowMoStartProgress);
      return 1.0 - (1.0 - this.minTimeScale) * Math.sin(slowPhase * (Math.PI / 2));
    }
    return 1.0;
  }
}
