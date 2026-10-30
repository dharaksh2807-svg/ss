import * as THREE from 'three';
import { CONSTANTS, LaneIndex, isDeveloperMode } from '../core/Constants';
import { Player } from '../player/Player';
import { CameraController } from '../scene/CameraController';
import { ObstacleInstance, ObstacleType } from '../track/ObstacleFactory';
import { TrackChunk } from '../track/TrackChunk';
import { CollisionDiagnostic } from '../track/CollisionTypes';
import { EventBus, EVENTS } from '../core/EventBus';
import { InputAction } from '../core/InputManager';
import { GameMode } from '../progression/ProgressionTypes';
import {
  SNAPSHOT_SCHEMA_VERSION,
  GAME_BUILD_VERSION,
  APP_ID,
  MAX_SNAPSHOT_FRAMES,
  BugTriggerType,
  BugSnapshotFrame,
  BugSnapshotPackage,
  SnapshotObstacle,
  SnapshotTriggerInfo,
  SnapshotRunContext,
  SnapshotReproducibility
} from './BugSnapshotTypes';

export type ScreenshotCaptureHandler = () => string | undefined;

export class BugSnapshotManager {
  private static instance: BugSnapshotManager | null = null;

  // Dedicated screenshot capture hook registered by game renderer
  private captureHandler: ScreenshotCaptureHandler | null = null;

  // Rolling circular buffer
  private buffer: Array<BugSnapshotFrame | null> = new Array(MAX_SNAPSHOT_FRAMES).fill(null);
  private head: number = 0;
  private count: number = 0;
  private totalFramesRecorded: number = 0;

  // Recent input trace within active session
  private recentInputs: Array<{ time: number; action: InputAction }> = [];
  private lastCapturedInput: { time: number; action: InputAction } | null = null;

  // Stored snapshots (in-memory history for current developer session, max 5)
  private snapshotHistory: BugSnapshotPackage[] = [];
  private latestSnapshot: BugSnapshotPackage | null = null;

  // Invariant monitoring state
  private lastAutoSnapshotTime: number = 0;
  private autoSnapshotCooldownSec: number = 1.5;
  private prevFrameState: {
    y: number;
    z: number;
    supportSurface: string;
    activeSupportId: string | null;
    isJumping: boolean;
  } | null = null;

  // Active run context
  private runSeed: number = 1337;
  private gameMode: GameMode = 'NORMAL';
  private difficulty: string = 'NORMAL';
  private activeEnvironment: string = 'MODERN_METRO';
  private activeDistrict: string = 'DOWNTOWN';

  private eventBus = EventBus.getInstance();

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): BugSnapshotManager {
    if (!BugSnapshotManager.instance) {
      BugSnapshotManager.instance = new BugSnapshotManager();
    }
    return BugSnapshotManager.instance;
  }

  public setCaptureHandler(handler: ScreenshotCaptureHandler | null): void {
    this.captureHandler = handler;
  }

  public setRunContext(context: {
    seed?: number;
    gameMode?: GameMode;
    difficulty?: string;
    activeEnvironment?: string;
    activeDistrict?: string;
  }): void {
    if (context.seed !== undefined) this.runSeed = context.seed;
    if (context.gameMode !== undefined) this.gameMode = context.gameMode;
    if (context.difficulty !== undefined) this.difficulty = context.difficulty;
    if (context.activeEnvironment !== undefined) this.activeEnvironment = context.activeEnvironment;
    if (context.activeDistrict !== undefined) this.activeDistrict = context.activeDistrict;
  }

  private setupEventListeners(): void {
    this.eventBus.on('INPUT_ACTION', (action: InputAction) => {
      const now = typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
      const inputEntry = { time: Math.round(now * 1000) / 1000, action };
      this.lastCapturedInput = inputEntry;
      this.recentInputs.push(inputEntry);
      // Keep recent inputs bounded to last 150 actions
      if (this.recentInputs.length > 150) {
        this.recentInputs.shift();
      }
    });
  }

  /**
   * Authoritative debugging preference: auto-open crash report modal.
   * Default: false (silent background recording during gameplay).
   * Legacy localStorage values are actively purged to prevent auto-popups for ordinary players.
   */
  public getAutoOpenCrashReport(): boolean {
    if (!isDeveloperMode()) {
      return false;
    }
    if (typeof window !== 'undefined' && (window as any).__DEV_AUTO_OPEN_CRASH_REPORT__ !== undefined) {
      return (window as any).__DEV_AUTO_OPEN_CRASH_REPORT__ === true;
    }
    return false;
  }

  public setAutoOpenCrashReport(enabled: boolean): void {
    const targetState = enabled && isDeveloperMode();
    if (typeof window !== 'undefined') {
      (window as any).__DEV_AUTO_OPEN_CRASH_REPORT__ = targetState;
      try {
        window.localStorage.removeItem('metro_debug_auto_open_crash_report');
      } catch {
        // Storage access may be restricted
      }
    }
  }

  /**
   * Resets the buffer for a fresh run
   */
  public reset(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.count = 0;
    this.totalFramesRecorded = 0;
    this.recentInputs = [];
    this.lastCapturedInput = null;
    this.prevFrameState = null;
    this.latestSnapshot = null;
    this.lastAutoSnapshotTime = 0;
  }

  /**
   * Records a single lightweight simulation frame into the rolling circular buffer.
   * Completely avoids copying 3D scene graphs, textures, or GPU buffers.
   */
  public recordFrame(params: {
    player: Player;
    cameraController: CameraController;
    nearbyObstacles?: ObstacleInstance[];
    simTime?: number;
    nowTime?: number;
    diagnostic?: CollisionDiagnostic | null;
    chunkId?: string;
  }): void {
    const {
      player,
      cameraController,
      nearbyObstacles = [],
      simTime = this.totalFramesRecorded * (1 / 60),
      nowTime = typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000,
      diagnostic = null,
      chunkId
    } = params;

    const playerZ = player.position.z;

    // Filter nearby active obstacles [-45m, +25m around player]
    const obsSnapshots: SnapshotObstacle[] = [];
    for (let i = 0; i < nearbyObstacles.length; i++) {
      const obs = nearbyObstacles[i];
      if (!obs.active) continue;
      const obsZ = obs.group.position.z;
      if (obsZ >= playerZ - 45 && obsZ <= playerZ + 25) {
        const center = new THREE.Vector3();
        obs.collider.getCenter(center);
        const size = new THREE.Vector3();
        obs.collider.getSize(size);

        obsSnapshots.push({
          id: obs.id,
          type: obs.type,
          lane: obs.lane,
          x: obs.group.position.x,
          y: obs.group.position.y,
          z: obsZ,
          width: Math.round(size.x * 100) / 100,
          height: Math.round(size.y * 100) / 100,
          depth: Math.round(size.z * 100) / 100,
          velocityZ: obs.velocityZ,
          active: obs.active,
          hasRamp: obs.hasRamp,
          roofSurfaceY: obs.roofSurfaceY,
          meshZ: obs.group.position.z,
          colliderMinZ: obs.collider.min.z,
          colliderMaxZ: obs.collider.max.z
        });
      }
    }

    const frame: BugSnapshotFrame = {
      frameIndex: this.totalFramesRecorded,
      timestamp: Math.round(nowTime * 1000) / 1000,
      simTime: Math.round(simTime * 1000) / 1000,
      distance: Math.round(player.distanceTraveled * 10) / 10,
      player: {
        lane: player.currentLane,
        targetLane: player.targetLane,
        x: Math.round(player.position.x * 1000) / 1000,
        y: Math.round(player.position.y * 1000) / 1000,
        z: Math.round(player.position.z * 1000) / 1000,
        vx: 0,
        vy: Math.round(player.verticalVelocity * 100) / 100,
        vz: Math.round(-player.speed * 100) / 100,
        speed: Math.round(player.speed * 100) / 100,
        state: player.state,
        groundY: Math.round(player.groundY * 100) / 100,
        supportSurface: player.supportSurface,
        activeSupportObstacleId: player.activeSupportObstacleId,
        isJumping: player.isJumping,
        isSliding: player.isSliding,
        isFastDropping: player.isFastDropping,
        jumpPhase: String(player.jumpPhase),
        jetpackPhase: player.state === 'JETPACK' ? 'ACTIVE' : 'NONE'
      },
      powerups: {
        hasShield: player.powerups ? player.powerups.hasShieldActive() : false,
        hasHoverboard: player.hoverboardManager ? player.hoverboardManager.isBoardActive() : false,
        hasSneakers: player.powerups ? player.powerups.isActive('SNEAKERS') : false,
        hasMagnet: player.powerups ? player.powerups.isActive('MAGNET') : false,
        hasJetpack: player.powerups ? player.powerups.isActive('JETPACK') : false,
        isInvulnerable: player.isInvulnerable()
      },
      camera: {
        posX: Math.round(cameraController.camera.position.x * 100) / 100,
        posY: Math.round(cameraController.camera.position.y * 100) / 100,
        posZ: Math.round(cameraController.camera.position.z * 100) / 100,
        fov: cameraController.camera.fov
      },
      nearbyObstacles: obsSnapshots,
      recentInput: this.lastCapturedInput,
      collisionDiagnostic: diagnostic,
      chunkId
    };

    this.buffer[this.head] = frame;
    this.head = (this.head + 1) % MAX_SNAPSHOT_FRAMES;
    if (this.count < MAX_SNAPSHOT_FRAMES) {
      this.count++;
    }
    this.totalFramesRecorded++;

    // Update previous frame state for invariant checking
    this.prevFrameState = {
      y: player.position.y,
      z: player.position.z,
      supportSurface: player.supportSurface,
      activeSupportId: player.activeSupportObstacleId,
      isJumping: player.isJumping
    };
  }

  // ---------------------------------------------------------------------------
  // Automated Failure Invariant Monitors
  // ---------------------------------------------------------------------------

  /**
   * Evaluates simulation invariants. Automatically triggers snapshots when anomalous
   * failures or physics corruptions occur.
   */
  public runInvariantChecks(
    player: Player,
    nearbyObstacles: ObstacleInstance[] = [],
    activeChunk?: TrackChunk | null
  ): BugSnapshotPackage | null {
    const now = typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
    if (now - this.lastAutoSnapshotTime < this.autoSnapshotCooldownSec) {
      return null;
    }

    // 1. Invalid Physics Check (NaN, Infinity, Extreme Velocity, Out of Bounds)
    const physicsErr = this.checkPhysicsInvariants(player);
    if (physicsErr) {
      return this.triggerAutoSnapshot('INVALID_PHYSICS', physicsErr.reason, physicsErr.details);
    }

    // 2. Rooftop Clipping or Fall-through Check
    const rooftopErr = this.checkRooftopClipping(player, nearbyObstacles);
    if (rooftopErr) {
      return this.triggerAutoSnapshot('ROOFTOP_CLIPPING_OR_FALL', rooftopErr.reason, rooftopErr.details);
    }

    // 3. Train Mesh / Collider Disagreement Check
    const desyncErr = this.checkTrainMeshColliderSync(nearbyObstacles);
    if (desyncErr) {
      return this.triggerAutoSnapshot('TRAIN_COLLIDER_DESYNC', desyncErr.reason, desyncErr.details);
    }

    // 4. Procedural Solvability / Impossible Obstacle Pattern
    if (activeChunk) {
      const solvabilityErr = this.checkObstaclePatternSolvability(activeChunk);
      if (solvabilityErr) {
        return this.triggerAutoSnapshot('IMPOSSIBLE_OBSTACLE_PATTERN', solvabilityErr.reason, solvabilityErr.details);
      }
    }

    return null;
  }

  /**
   * Checks for NaN, infinite values, or out-of-bounds kinematic states
   */
  public checkPhysicsInvariants(player: Player): { reason: string; details: Record<string, any> } | null {
    const { x, y, z } = player.position;

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return {
        reason: `Player position contains non-finite coordinates (X=${x}, Y=${y}, Z=${z})`,
        details: { position: { x, y, z }, velocityY: player.verticalVelocity }
      };
    }

    if (!Number.isFinite(player.verticalVelocity) || Math.abs(player.verticalVelocity) > 85.0) {
      return {
        reason: `Player vertical velocity anomalous or exceeded terminal safety bound (Vy=${player.verticalVelocity})`,
        details: { verticalVelocity: player.verticalVelocity, positionY: y }
      };
    }

    if (Math.abs(x) > 6.0) {
      return {
        reason: `Player lateral position outside track corridor boundaries (|X| = ${Math.abs(x)} > 6.0m)`,
        details: { posX: x, lane: player.currentLane, targetLane: player.targetLane }
      };
    }

    if (player.speed < 0 || player.speed > 120.0 || !Number.isFinite(player.speed)) {
      return {
        reason: `Player forward speed outside valid kinematic bounds (Speed=${player.speed} m/s)`,
        details: { speed: player.speed }
      };
    }

    return null;
  }

  /**
   * Checks whether the player was supported on a train roof and abruptly clipped/dropped
   * through the solid roof into the carriage hull without jumping or walking off.
   */
  public checkRooftopClipping(
    player: Player,
    nearbyObstacles: ObstacleInstance[]
  ): { reason: string; details: Record<string, any> } | null {
    if (!this.prevFrameState) return null;

    // Was supported on a train roof in the recent step
    const wasOnRoof = this.prevFrameState.supportSurface === 'TRAIN_ROOF';
    const prevY = this.prevFrameState.y;
    const currentY = player.position.y;

    if (wasOnRoof && prevY >= 3.8 && currentY < 3.0) {
      // If player didn't jump and isn't in intentional drop
      if (!player.isJumping && player.state !== 'JUMP') {
        // Find if player is still horizontally within the bounds of a train
        for (const obs of nearbyObstacles) {
          if (
            (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP') &&
            obs.active
          ) {
            const laneX = CONSTANTS.LANES[obs.lane];
            const dx = Math.abs(player.position.x - laneX);
            const obsZ = obs.group.position.z;
            const halfLen = (obs.length || CONSTANTS.TRAIN_LENGTH_SHORT) / 2;

            if (dx < 1.4 && player.position.z >= obsZ - halfLen && player.position.z <= obsZ + halfLen) {
              return {
                reason: `Player fell through train roof on obstacle '${obs.id}' (${obs.type}) from Y=${prevY.toFixed(2)} to Y=${currentY.toFixed(2)} without jumping`,
                details: {
                  obstacleId: obs.id,
                  obstacleType: obs.type,
                  prevY,
                  currentY,
                  playerZ: player.position.z,
                  obsZ,
                  trainLength: obs.length
                }
              };
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Verifies that moving train mesh groups and their physics collision boxes remain synchronized.
   */
  public checkTrainMeshColliderSync(
    nearbyObstacles: ObstacleInstance[]
  ): { reason: string; details: Record<string, any> } | null {
    for (const obs of nearbyObstacles) {
      if ((obs.type === 'MOVING_TRAIN' || obs.isMoving) && obs.active) {
        const meshZ = obs.group.position.z;
        const box = obs.bodyCollider || obs.collider;
        const centerZ = (box.min.z + box.max.z) / 2;
        const delta = Math.abs(meshZ - centerZ);

        // An offset greater than 3.5m indicates collider/visual displacement
        if (delta > 3.5) {
          return {
            reason: `Moving train '${obs.id}' mesh position Z=${meshZ.toFixed(2)} disagrees with physics collider center Z=${centerZ.toFixed(2)} by ${delta.toFixed(2)}m`,
            details: {
              obstacleId: obs.id,
              meshZ,
              colliderCenterZ: centerZ,
              discrepancyMeters: delta,
              velocityZ: obs.velocityZ
            }
          };
        }
      }
    }
    return null;
  }

  /**
   * Checks whether a chunk generated an impossible obstacle configuration where all 3 lanes
   * are impassable at the same Z coordinate.
   */
  public checkObstaclePatternSolvability(
    chunk: TrackChunk
  ): { reason: string; details: Record<string, any> } | null {
    if (!chunk || !chunk.obstacles || chunk.obstacles.length < 3) return null;

    // Group active obstacles by approximate Z location
    const zBuckets = new Map<number, ObstacleInstance[]>();
    for (const obs of chunk.obstacles) {
      if (!obs.active) continue;
      const bucketKey = Math.round(obs.group.position.z / 4.0) * 4.0;
      const list = zBuckets.get(bucketKey) || [];
      list.push(obs);
      zBuckets.set(bucketKey, list);
    }

    for (const [bucketZ, obstacles] of zBuckets.entries()) {
      const lanesCovered = new Set<LaneIndex>();
      let hasPassableOption = false;

      for (const obs of obstacles) {
        lanesCovered.add(obs.lane);

        // Jumpable or climbable affordances
        if (obs.hasRamp || obs.type === 'TRAIN_RAMP' || obs.type === 'LOW_BARRIER') {
          hasPassableOption = true;
        }
      }

      // If all 3 lanes (-1, 0, 1) are occupied at the same Z without a climbable ramp or low barrier
      if (
        lanesCovered.has(-1) &&
        lanesCovered.has(0) &&
        lanesCovered.has(1) &&
        !hasPassableOption &&
        obstacles.length >= 3
      ) {
        return {
          reason: `Procedural generation produced impassable 3-lane blockage near Z=${bucketZ.toFixed(1)}m without ramp or clearance`,
          details: {
            chunkZ: chunk.chunkZ,
            bucketZ,
            obstacleCount: obstacles.length,
            obstacleTypes: obstacles.map(o => `${o.type}@L${o.lane}`)
          }
        };
      }
    }

    return null;
  }

  /**
   * Records a fatal collision event and captures a snapshot.
   */
  public recordFatalCollision(params: {
    reason: string;
    player: Player;
    obstacle?: ObstacleInstance | null;
    diagnostic?: CollisionDiagnostic | null;
    isFrontal?: boolean;
    isFlankContact?: boolean;
    isGlance?: boolean;
    cameraController?: CameraController;
    nearbyObstacles?: ObstacleInstance[];
  }): BugSnapshotPackage {
    const {
      reason,
      player,
      obstacle,
      diagnostic,
      isFrontal = true,
      isFlankContact = false,
      isGlance = false,
      cameraController,
      nearbyObstacles = []
    } = params;

    const now = typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
    if (
      !obstacle &&
      !diagnostic &&
      this.latestSnapshot &&
      this.latestSnapshot.trigger.type === 'FATAL_COLLISION' &&
      now - this.lastAutoSnapshotTime < 1.0
    ) {
      return this.latestSnapshot;
    }

    // Determine obstacle geometry details
    const obsZ = obstacle ? obstacle.group.position.z : (diagnostic?.contactPosition?.z ?? player.position.z);
    const obsLen = obstacle?.length || CONSTANTS.TRAIN_LENGTH_SHORT;
    const halfLen = obsLen / 2;
    const nearZ = obstacle ? obstacle.collider.max.z : (diagnostic?.contactPosition?.z ?? player.position.z);
    const farZ = obstacle ? obstacle.collider.min.z : (diagnostic?.contactPosition?.z ?? player.position.z);
    const distToFrontBumper = Math.max(0, Math.abs(player.position.z - nearZ));
    const relSpeed = player.speed + Math.abs(obstacle?.velocityZ || 0);
    const timeToImpact = relSpeed > 0 ? Math.round((distToFrontBumper / relSpeed) * 1000) / 1000 : 0;

    const queuedLaneChange = player.getQueuedLaneChange ? player.getQueuedLaneChange() : null;

    const details: Record<string, any> = {
      obstacleId: obstacle?.id || diagnostic?.obstacleId || 'N/A',
      obstacleType: obstacle?.type || diagnostic?.collisionType || reason,
      collisionClassification: diagnostic?.collisionType || (isFrontal ? 'MAJOR_FATAL_HIT' : 'SIDE_FLANK_COLLISION'),
      playerLane: player.currentLane,
      playerPosition: {
        x: Math.round(player.position.x * 1000) / 1000,
        y: Math.round(player.position.y * 1000) / 1000,
        z: Math.round(player.position.z * 1000) / 1000
      },
      playerVelocity: {
        vx: 0,
        vy: Math.round(player.verticalVelocity * 100) / 100,
        vz: Math.round(-player.speed * 100) / 100,
        speed: Math.round(player.speed * 100) / 100
      },
      obstaclePosition: obstacle ? {
        x: Math.round(obstacle.group.position.x * 1000) / 1000,
        y: Math.round(obstacle.group.position.y * 1000) / 1000,
        z: Math.round(obstacle.group.position.z * 1000) / 1000
      } : null,
      obstacleVelocity: obstacle ? {
        vx: 0,
        vy: 0,
        vz: Math.round((obstacle.velocityZ || 0) * 100) / 100
      } : null,
      obstacleBounds: obstacle ? {
        centerZ: Math.round(((nearZ + farZ) / 2) * 100) / 100,
        nearZ: Math.round(nearZ * 100) / 100,
        farZ: Math.round(farZ * 100) / 100,
        hasRamp: obstacle.hasRamp || false
      } : null,
      timeToImpact,
      contactPosition: diagnostic?.contactPosition
        ? {
            x: Math.round(diagnostic.contactPosition.x * 1000) / 1000,
            y: Math.round(diagnostic.contactPosition.y * 1000) / 1000,
            z: Math.round(diagnostic.contactPosition.z * 1000) / 1000
          }
        : {
            x: Math.round(player.position.x * 1000) / 1000,
            y: Math.round(player.position.y * 1000) / 1000,
            z: Math.round(player.position.z * 1000) / 1000
          },
      playerState: player.state,
      supportSurface: player.supportSurface,
      isFrontal,
      isFlankContact,
      isGlance,
      queuedLaneChange,
      simTime: Math.round(this.totalFramesRecorded * (1 / 60) * 1000) / 1000
    };

    // Ensure the collision event itself is recorded as the final frame in the rolling buffer
    const lastFrame = this.count > 0 ? this.buffer[(this.head - 1 + MAX_SNAPSHOT_FRAMES) % MAX_SNAPSHOT_FRAMES] : null;
    if (!lastFrame || lastFrame.player.state !== 'CRASH') {
      const activeObs = nearbyObstacles.length > 0 ? nearbyObstacles : (obstacle ? [obstacle] : []);
      const obsSnapshots: SnapshotObstacle[] = [];
      for (const obs of activeObs) {
        if (!obs.active && obs !== obstacle) continue;
        const size = new THREE.Vector3();
        obs.collider.getSize(size);
        obsSnapshots.push({
          id: obs.id,
          type: obs.type,
          lane: obs.lane,
          x: obs.group.position.x,
          y: obs.group.position.y,
          z: obs.group.position.z,
          width: Math.round(size.x * 100) / 100,
          height: Math.round(size.y * 100) / 100,
          depth: Math.round(size.z * 100) / 100,
          velocityZ: obs.velocityZ,
          active: obs.active,
          hasRamp: obs.hasRamp,
          roofSurfaceY: obs.roofSurfaceY,
          meshZ: obs.group.position.z,
          colliderMinZ: obs.collider.min.z,
          colliderMaxZ: obs.collider.max.z
        });
      }

      const camTransform = cameraController ? {
        posX: Math.round(cameraController.camera.position.x * 100) / 100,
        posY: Math.round(cameraController.camera.position.y * 100) / 100,
        posZ: Math.round(cameraController.camera.position.z * 100) / 100,
        fov: cameraController.camera.fov
      } : (lastFrame?.camera || { posX: 0, posY: 4, posZ: 6, fov: 60 });

      const impactFrame: BugSnapshotFrame = {
        frameIndex: this.totalFramesRecorded,
        timestamp: Math.round(now * 1000) / 1000,
        simTime: Math.round(this.totalFramesRecorded * (1 / 60) * 1000) / 1000,
        distance: Math.round(player.distanceTraveled * 10) / 10,
        player: {
          lane: player.currentLane,
          targetLane: player.targetLane,
          x: Math.round(player.position.x * 1000) / 1000,
          y: Math.round(player.position.y * 1000) / 1000,
          z: Math.round(player.position.z * 1000) / 1000,
          vx: 0,
          vy: Math.round(player.verticalVelocity * 100) / 100,
          vz: Math.round(-player.speed * 100) / 100,
          speed: Math.round(player.speed * 100) / 100,
          state: 'CRASH',
          groundY: Math.round(player.groundY * 100) / 100,
          supportSurface: player.supportSurface,
          activeSupportObstacleId: player.activeSupportObstacleId,
          isJumping: player.isJumping,
          isSliding: player.isSliding,
          isFastDropping: player.isFastDropping,
          jumpPhase: String(player.jumpPhase),
          jetpackPhase: player.state === 'JETPACK' ? 'ACTIVE' : 'NONE'
        },
        powerups: {
          hasShield: player.powerups ? player.powerups.hasShieldActive() : false,
          hasHoverboard: player.hoverboardManager ? player.hoverboardManager.isBoardActive() : false,
          hasSneakers: player.powerups ? player.powerups.isActive('SNEAKERS') : false,
          hasMagnet: player.powerups ? player.powerups.isActive('MAGNET') : false,
          hasJetpack: player.powerups ? player.powerups.isActive('JETPACK') : false,
          isInvulnerable: player.isInvulnerable()
        },
        camera: camTransform,
        nearbyObstacles: obsSnapshots,
        recentInput: this.lastCapturedInput,
        collisionDiagnostic: diagnostic,
        chunkId: obstacle?.id ? obstacle.id.split('_')[0] + '_' + obstacle.id.split('_')[1] : undefined
      };

      this.buffer[this.head] = impactFrame;
      this.head = (this.head + 1) % MAX_SNAPSHOT_FRAMES;
      if (this.count < MAX_SNAPSHOT_FRAMES) {
        this.count++;
      }
      this.totalFramesRecorded++;
    }

    // Capture screenshot synchronously at the impact moment
    const screenshot = this.safeCaptureCanvasScreenshot();

    return this.triggerAutoSnapshot(
      'FATAL_COLLISION',
      `Fatal collision encountered: ${reason} (Obstacle: ${details.obstacleType}, Lane: ${player.currentLane})`,
      details,
      screenshot
    );
  }

  // ---------------------------------------------------------------------------
  // Snapshot Creation & Export
  // ---------------------------------------------------------------------------

  private triggerAutoSnapshot(
    type: BugTriggerType,
    observedFailure: string,
    details: Record<string, any>,
    screenshotBase64?: string
  ): BugSnapshotPackage {
    this.lastAutoSnapshotTime = typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
    const pkg = this.buildSnapshotPackage(
      {
        type,
        reason: observedFailure,
        details,
        observedFailure
      },
      screenshotBase64
    );

    this.latestSnapshot = pkg;
    this.snapshotHistory.push(pkg);
    if (this.snapshotHistory.length > 5) {
      this.snapshotHistory.shift();
    }

    this.eventBus.emit('BUG_SNAPSHOT_CAPTURED', pkg);
    return pkg;
  }

  /**
   * Manually captures the current rolling buffer state into a snapshot package
   */
  public captureManualSnapshot(
    reason: string = 'Manual tester diagnostic capture',
    screenshotBase64?: string
  ): BugSnapshotPackage {
    const screenshot = screenshotBase64 || this.safeCaptureCanvasScreenshot();
    const pkg = this.buildSnapshotPackage(
      {
        type: 'MANUAL_TRIGGER',
        reason,
        details: { manualCapture: true },
        observedFailure: reason
      },
      screenshot
    );

    this.latestSnapshot = pkg;
    this.snapshotHistory.push(pkg);
    if (this.snapshotHistory.length > 5) {
      this.snapshotHistory.shift();
    }

    this.eventBus.emit('BUG_SNAPSHOT_CAPTURED', pkg);
    return pkg;
  }

  private buildSnapshotPackage(
    trigger: SnapshotTriggerInfo,
    screenshotBase64?: string
  ): BugSnapshotPackage {
    const chronologicalFrames: BugSnapshotFrame[] = [];
    if (this.count > 0) {
      const startIndex = this.count < MAX_SNAPSHOT_FRAMES ? 0 : this.head;
      for (let i = 0; i < this.count; i++) {
        const idx = (startIndex + i) % MAX_SNAPSHOT_FRAMES;
        const frame = this.buffer[idx];
        if (frame) {
          chronologicalFrames.push(frame);
        }
      }
    }

    if (chronologicalFrames.length === 0) {
      chronologicalFrames.push({
        frameIndex: 0,
        timestamp: Date.now() / 1000,
        simTime: 0,
        distance: 0,
        player: {
          lane: 1,
          targetLane: 1,
          x: 0,
          y: 0,
          z: 0,
          vx: 0,
          vy: 0,
          vz: -CONSTANTS.INITIAL_SPEED,
          speed: CONSTANTS.INITIAL_SPEED,
          state: 'RUN',
          groundY: 0,
          supportSurface: 'GROUND',
          activeSupportObstacleId: null,
          isJumping: false,
          isSliding: false,
          isFastDropping: false,
          jumpPhase: 'NONE',
          jetpackPhase: 'NONE'
        },
        powerups: {
          hasShield: false,
          hasHoverboard: false,
          hasSneakers: false,
          hasMagnet: false,
          hasJetpack: false,
          isInvulnerable: false
        },
        camera: {
          posX: 0,
          posY: 4,
          posZ: 6,
          fov: 60
        },
        nearbyObstacles: [],
        recentInput: null,
        collisionDiagnostic: null,
        chunkId: 'initial_spawn'
      });
    }

    const lastFrame = chronologicalFrames[chronologicalFrames.length - 1];
    const runContext: SnapshotRunContext = {
      seed: this.runSeed,
      gameMode: this.gameMode,
      difficulty: this.difficulty,
      distance: lastFrame ? lastFrame.distance : 0,
      speed: lastFrame ? lastFrame.player.speed : CONSTANTS.INITIAL_SPEED,
      activeEnvironment: this.activeEnvironment,
      activeDistrict: this.activeDistrict,
      score: lastFrame ? Math.floor(lastFrame.distance * 10) : 0,
      generatorVersion: '1.0.0-reachability-v2'
    };

    // Filter inputs that fall within the snapshot interval
    const firstTimestamp = chronologicalFrames[0]?.timestamp || 0;
    let relevantInputs = this.recentInputs.filter(inp => inp.time >= firstTimestamp - 0.5);
    if (relevantInputs.length === 0 && this.recentInputs.length > 0) {
      relevantInputs = this.recentInputs.slice(-10);
    }

    let screenshotStatus: 'CAPTURED' | 'FAILED' | 'UNAVAILABLE_HEADLESS';
    if (screenshotBase64 && screenshotBase64.startsWith('data:image/') && screenshotBase64.length > 200) {
      screenshotStatus = 'CAPTURED';
    } else if (typeof document === 'undefined') {
      screenshotStatus = 'UNAVAILABLE_HEADLESS';
    } else {
      screenshotStatus = 'FAILED';
    }

    const reproducibility: SnapshotReproducibility = {
      isReplayable: this.runSeed > 0 && chronologicalFrames.length > 0,
      mode: 'DETERMINISTIC_SEED',
      confidence: chronologicalFrames.length >= 30 ? 'HIGH' : 'MEDIUM',
      notes: `Captured ${chronologicalFrames.length} frames with deterministic seed ${this.runSeed}.`
    };

    const now = Date.now();
    return {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      appId: APP_ID,
      gameVersion: GAME_BUILD_VERSION,
      exportTimestamp: now,
      isoDate: new Date(now).toISOString(),
      trigger,
      runContext,
      frames: chronologicalFrames,
      inputs: relevantInputs,
      reproducibility,
      screenshotBase64,
      screenshotStatus
    };
  }

  public getLatestSnapshot(): BugSnapshotPackage | null {
    return this.latestSnapshot;
  }

  public getSnapshotHistory(): BugSnapshotPackage[] {
    return [...this.snapshotHistory];
  }

  public getBufferCount(): number {
    return this.count;
  }

  // ---------------------------------------------------------------------------
  // Human-Readable Summary & JSON Export Formatter
  // ---------------------------------------------------------------------------

  /**
   * Generates a clean markdown bug report formatted specifically for copy-pasting
   * directly to an AI agent or issue tracker.
   */
  public generateMarkdownSummary(snapshot: BugSnapshotPackage): string {
    const { trigger, runContext, frames, inputs, reproducibility, isoDate, gameVersion } = snapshot;
    const lastFrame = frames[frames.length - 1];
    const p = lastFrame ? lastFrame.player : null;
    const d = trigger.details || {};

    const nearbyObsList = lastFrame && lastFrame.nearbyObstacles.length > 0
      ? lastFrame.nearbyObstacles
          .slice(0, 6)
          .map(
            o =>
              `  - \`${o.id}\` [${o.type}] Lane ${o.lane} at X=${o.x.toFixed(1)}, Y=${o.y.toFixed(1)}, Z=${o.z.toFixed(1)}m (VelZ=${o.velocityZ || 0})`
          )
          .join('\n')
      : '  - None';

    const recentInputsList = inputs.length > 0
      ? inputs
          .slice(-8)
          .map(i => `  - \`${i.action}\` at ${i.time.toFixed(3)}s`)
          .join('\n')
      : `  - None (0 player input actions occurred prior to failure point at ${p ? p.z.toFixed(1) : '0'}m, simTime: ${lastFrame ? lastFrame.simTime.toFixed(3) : '0'}s)`;

    return [
      `### 🐛 METRO RUNNER 3D — GAMEPLAY BUG SNAPSHOT REPORT`,
      `**Timestamp:** ${isoDate} | **Build:** v${gameVersion} | **Schema:** v${snapshot.schemaVersion}`,
      ``,
      `#### 🚨 FAILURE SUMMARY`,
      `- **Trigger:** \`${trigger.type}\``,
      `- **Observed Failure:** ${trigger.observedFailure}`,
      `- **Reason:** ${trigger.reason}`,
      d.obstacleId ? `- **Impact Obstacle ID:** \`${d.obstacleId}\` [${d.obstacleType || 'UNKNOWN'}]` : '',
      d.collisionClassification ? `- **Collision Classification:** \`${d.collisionClassification}\` (Frontal: ${d.isFrontal ?? true})` : '',
      d.contactPosition ? `- **Contact Point:** X=${d.contactPosition.x?.toFixed(2)}, Y=${d.contactPosition.y?.toFixed(2)}, Z=${d.contactPosition.z?.toFixed(2)}m` : '',
      d.timeToImpact !== undefined ? `- **Time To Impact:** ${d.timeToImpact.toFixed(3)}s` : '',
      ``,
      `#### 🎮 RUN CONFIGURATION & STATE`,
      `- **Deterministic Seed:** \`${runContext.seed}\``,
      `- **Game Mode:** ${runContext.gameMode} (${runContext.difficulty})`,
      `- **Distance:** ${runContext.distance.toFixed(1)}m | **Speed:** ${runContext.speed.toFixed(1)} m/s`,
      `- **Generator Version:** \`${runContext.generatorVersion || '1.0.0-reachability-v2'}\``,
      `- **Environment / District:** ${runContext.activeEnvironment} / ${runContext.activeDistrict || 'DEFAULT'}`,
      ``,
      `#### 🏃 PLAYER KINEMATICS AT FAILURE POINT`,
      p ? [
        `- **Position:** X=${p.x.toFixed(2)}, Y=${p.y.toFixed(2)}, Z=${p.z.toFixed(2)}m (GroundY: ${p.groundY.toFixed(2)}m)`,
        `- **Lane:** ${p.lane} (Target: ${p.targetLane})`,
        `- **State:** \`${p.state}\` | **Support Surface:** \`${p.supportSurface}\` (ActiveSupport: ${p.activeSupportObstacleId || 'GROUND'})`,
        `- **Airborne:** Jump=${p.isJumping} (Phase: ${p.jumpPhase}) | Slide=${p.isSliding} | FastDrop=${p.isFastDropping}`,
        `- **Vertical Velocity (Vy):** ${p.vy.toFixed(2)} m/s`,
        d.queuedLaneChange ? `- **Pending Queued Input:** \`${d.queuedLaneChange}\`` : ''
      ].filter(Boolean).join('\n') : '- No frame kinematics available',
      ``,
      `#### 🛡️ ACTIVE POWERUPS & PROTECTION`,
      lastFrame ? [
        `- Shield: ${lastFrame.powerups.hasShield ? '✅ ACTIVE' : '❌'}`,
        `- Hoverboard: ${lastFrame.powerups.hasHoverboard ? '✅ ACTIVE' : '❌'}`,
        `- Super Sneakers: ${lastFrame.powerups.hasSneakers ? '✅ ACTIVE' : '❌'}`,
        `- Invulnerable: ${lastFrame.powerups.isInvulnerable ? '✅ ACTIVE' : '❌'}`
      ].join(' | ') : '- None',
      ``,
      `#### 🚧 NEARBY OBSTACLES AT IMPACT HORIZON`,
      nearbyObsList,
      ``,
      `#### 🕹️ RECENT INPUT ACTIONS`,
      recentInputsList,
      ``,
      `#### 📸 SCREENSHOT ARTIFACT`,
      `- **Capture Status:** \`${snapshot.screenshotStatus || (snapshot.screenshotBase64 ? 'CAPTURED' : 'UNAVAILABLE')}\``,
      `- **Payload Size:** ${snapshot.screenshotBase64 ? `${Math.round(snapshot.screenshotBase64.length / 1024)} KB` : '0 KB (None)'}`,
      ``,
      `#### 🔁 REPRODUCIBILITY ASSESSMENT`,
      `- **Replayable:** ${reproducibility.isReplayable ? 'YES (Deterministic Sandbox)' : 'NO (Diagnostic Only)'}`,
      `- **Confidence:** ${reproducibility.confidence}`,
      `- **Notes:** ${reproducibility.notes}`,
      ``,
      `> ℹ️ *Tip: Paste this summary directly to an AI agent to reconstruct or debug collision and physics invariants.*`
    ].filter(line => line !== null && line !== undefined).join('\n');
  }

  /**
   * Serializes the snapshot package to clean, sanitized JSON string
   */
  public exportJson(snapshot: BugSnapshotPackage): string {
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Initiates local browser file download of the JSON snapshot package
   */
  public downloadJsonFile(snapshot: BugSnapshotPackage): void {
    if (typeof document === 'undefined') return;

    const jsonStr = this.exportJson(snapshot);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestampStr = new Date(snapshot.exportTimestamp)
      .toISOString()
      .replace(/[:.]/g, '-')
      .substring(0, 19);

    link.href = url;
    link.download = `metro-bug-snapshot-${snapshot.trigger.type.toLowerCase()}-${timestampStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Downloads the optional screenshot artifact as a separate image file
   */
  public downloadScreenshot(snapshot: BugSnapshotPackage): boolean {
    if (typeof document === 'undefined') return false;
    let dataUrl = snapshot.screenshotBase64;
    if (!dataUrl) {
      dataUrl = this.safeCaptureCanvasScreenshot();
    }
    if (!dataUrl || dataUrl.length < 200 || !dataUrl.startsWith('data:image/')) {
      console.warn('Screenshot download skipped: no valid screenshot image payload available.');
      return false;
    }

    const link = document.createElement('a');
    const timestampStr = new Date(snapshot.exportTimestamp)
      .toISOString()
      .replace(/[:.]/g, '-')
      .substring(0, 19);

    link.href = dataUrl;
    link.download = `metro-bug-screenshot-${snapshot.trigger.type.toLowerCase()}-${timestampStr}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  /**
   * Safely captures current canvas render as a base64 image without halting execution.
   * If a captureHandler is registered by the game, it executes a synchronous render
   * immediately before reading canvas.toDataURL(), avoiding the blank/black buffer
   * clearing inherent to default WebGL preserveDrawingBuffer: false.
   */
  public safeCaptureCanvasScreenshot(
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.Camera
  ): string | undefined {
    try {
      if (this.captureHandler) {
        const handlerResult = this.captureHandler();
        if (handlerResult && handlerResult.startsWith('data:image/') && handlerResult.length > 200) {
          return handlerResult;
        }
      }

      if (typeof document === 'undefined') return undefined;

      // If renderer, scene, and camera are passed directly, render immediately before read
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
        const canvas = renderer.domElement;
        if (canvas && typeof canvas.toDataURL === 'function') {
          return canvas.toDataURL('image/jpeg', 0.85);
        }
      }

      const canvas = renderer ? renderer.domElement : document.querySelector('canvas');
      if (canvas && typeof canvas.toDataURL === 'function') {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (dataUrl && dataUrl.startsWith('data:image/') && dataUrl.length > 200) {
          return dataUrl;
        }
      }
    } catch (e) {
      console.warn('Screenshot capture skipped or restricted:', e);
    }
    return undefined;
  }
}
