import { LaneIndex } from '../core/Constants';
import { PlayerState, SupportSurfaceType } from '../player/Player';
import { ObstacleType } from '../track/ObstacleFactory';
import { GameMode } from '../progression/ProgressionTypes';
import { CollisionDiagnostic } from '../track/CollisionTypes';
import { InputAction } from '../core/InputManager';

/**
 * Current schema version for bug snapshots
 */
export const SNAPSHOT_SCHEMA_VERSION = 1;
export const GAME_BUILD_VERSION = '1.0.0';
export const APP_ID = 'metro_runner_3d';

/**
 * Maximum capacity of the rolling circular frame buffer (~4.0s at 60 FPS)
 */
export const MAX_SNAPSHOT_FRAMES = 240;

/**
 * Triggers that can initiate a gameplay bug snapshot
 */
export type BugTriggerType =
  | 'MANUAL_TRIGGER'
  | 'FATAL_COLLISION'
  | 'ROOFTOP_CLIPPING_OR_FALL'
  | 'INVALID_PHYSICS'
  | 'TRAIN_COLLIDER_DESYNC'
  | 'IMPOSSIBLE_OBSTACLE_PATTERN'
  | 'TUNNELING_OR_PHASING';

/**
 * Serializable snapshot of a single obstacle near the player
 */
export interface SnapshotObstacle {
  id: string;
  type: ObstacleType;
  lane: LaneIndex;
  x: number;
  y: number;
  z: number;
  width?: number;
  height?: number;
  depth?: number;
  velocityZ?: number;
  active: boolean;
  hasRamp?: boolean;
  roofSurfaceY?: number;
  meshZ?: number;
  colliderMinZ?: number;
  colliderMaxZ?: number;
}

/**
 * Serializable snapshot of player state in a single simulation frame
 */
export interface SnapshotPlayerKinematics {
  lane: LaneIndex;
  targetLane: LaneIndex;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  state: PlayerState;
  groundY: number;
  supportSurface: SupportSurfaceType;
  activeSupportObstacleId: string | null;
  isJumping: boolean;
  isSliding: boolean;
  isFastDropping: boolean;
  jumpPhase: string;
  jetpackPhase: string;
}

/**
 * Serializable snapshot of active powerups and invulnerabilities
 */
export interface SnapshotPowerupState {
  hasShield: boolean;
  hasHoverboard: boolean;
  hasSneakers: boolean;
  hasMagnet: boolean;
  hasJetpack: boolean;
  isInvulnerable: boolean;
}

/**
 * Camera transform at time of frame
 */
export interface SnapshotCameraTransform {
  posX: number;
  posY: number;
  posZ: number;
  fov: number;
}

/**
 * A single frame recorded into the rolling bug buffer
 */
export interface BugSnapshotFrame {
  frameIndex: number;
  timestamp: number;
  simTime: number;
  distance: number;
  player: SnapshotPlayerKinematics;
  powerups: SnapshotPowerupState;
  camera: SnapshotCameraTransform;
  nearbyObstacles: SnapshotObstacle[];
  recentInput: { time: number; action: InputAction } | null;
  collisionDiagnostic?: CollisionDiagnostic | null;
  chunkId?: string;
}

/**
 * Run context and environment configuration
 */
export interface SnapshotRunContext {
  seed: number;
  gameMode: GameMode;
  difficulty: string;
  distance: number;
  speed: number;
  activeEnvironment: string;
  activeDistrict?: string;
  score: number;
  generatorVersion?: string;
}

/**
 * Trigger metadata explaining why the snapshot was taken
 */
export interface SnapshotTriggerInfo {
  type: BugTriggerType;
  reason: string;
  details: Record<string, any>;
  observedFailure: string;
}

/**
 * Reproducibility assessment metadata
 */
export interface SnapshotReproducibility {
  isReplayable: boolean;
  mode: 'EXACT_SCENARIO' | 'DETERMINISTIC_SEED' | 'DIAGNOSTIC_ONLY';
  confidence: 'HIGH' | 'MEDIUM' | 'DIAGNOSTIC_ONLY';
  notes: string;
}

/**
 * Complete, exportable Bug Snapshot Package
 */
export interface BugSnapshotPackage {
  schemaVersion: number;
  appId: string;
  gameVersion: string;
  exportTimestamp: number;
  isoDate: string;
  trigger: SnapshotTriggerInfo;
  runContext: SnapshotRunContext;
  frames: BugSnapshotFrame[];
  inputs: Array<{ time: number; action: InputAction }>;
  reproducibility: SnapshotReproducibility;
  screenshotBase64?: string;
  screenshotStatus?: 'CAPTURED' | 'FAILED' | 'UNAVAILABLE_HEADLESS';
}
