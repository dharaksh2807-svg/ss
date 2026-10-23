import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus } from '../core/EventBus';
import { EnvironmentId, EnvironmentTheme, EnvironmentManager } from './EnvironmentConfig';
import { EnvironmentRegistry } from './EnvironmentRegistry';
import { DistrictPlanner, TransitionProgress } from './DistrictPlanner';
import { SceneryFactory } from './SceneryFactory';
import { SceneryPool } from './SceneryPool';
import type { TrackChunk } from '../track/TrackChunk';
import type { WorldScene } from '../scene/WorldScene';

export interface ChunkSceneryMeta {
  chunkZ: number;
  chunkIndex: number;
  seed: number;
  districtId: EnvironmentId;
  isPortal: boolean;
}

export interface EnvironmentDiagnostics {
  currentEnvironment: EnvironmentId;
  currentRegionIndex: number;
  nextEnvironment: EnvironmentId;
  distanceToTransition: number;
  activeChunkSeeds: ChunkSceneryMeta[];
  sceneryMeshCount: number;
  estimatedDrawCalls: number;
  frameTimeMs: number;
}

export class EnvironmentDirector {
  private static instance: EnvironmentDirector;

  private registry = EnvironmentRegistry.getInstance();
  private planner: DistrictPlanner;
  private factory = SceneryFactory.getInstance();
  private pool = SceneryPool.getInstance();

  private runSeed: number = 1337;
  private isDebugSeed: boolean = false;
  private currentActiveDistrict: EnvironmentId = 'MODERN_METRO';
  private previousActiveDistrict: EnvironmentId = 'MODERN_METRO';
  private transitionEventEmittedForPortalZ: number | null = null;
  private changedEventEmittedForPortalZ: number | null = null;

  // Diagnostics tracking
  private activeChunksMeta: Map<number, ChunkSceneryMeta> = new Map();
  private lastFrameTime: number = 16.6;

  private constructor() {
    this.planner = new DistrictPlanner(this.runSeed);
    this.currentActiveDistrict = EnvironmentManager.getInstance().getStartingEnvironment();
    this.previousActiveDistrict = this.currentActiveDistrict;

    if (typeof window !== 'undefined') {
      (window as any).__ENV_DIRECTOR__ = this;
    }
  }

  public static getInstance(): EnvironmentDirector {
    if (!EnvironmentDirector.instance) {
      EnvironmentDirector.instance = new EnvironmentDirector();
    }
    return EnvironmentDirector.instance;
  }

  public setRunSeed(seed: number, isDebug: boolean = false): void {
    this.runSeed = seed >>> 0;
    this.isDebugSeed = isDebug;
    this.planner.reset(this.runSeed);
    this.activeChunksMeta.clear();
    this.transitionEventEmittedForPortalZ = null;
    this.changedEventEmittedForPortalZ = null;
  }

  public getRunSeed(): number {
    return this.runSeed;
  }

  public getDistrictPlanner(): DistrictPlanner {
    return this.planner;
  }

  /**
   * Deterministic 32-bit integer position hashing
   */
  public computeScenerySeed(chunkIndex: number, worldZ: number): number {
    let h = (this.runSeed ^ 0x5bd1e995) >>> 0;
    const k = Math.round(worldZ);
    h = Math.imul(h ^ k, 0xcc9e2d51);
    h = (h << 13) | (h >>> 19);
    h = Math.imul(h, 5) + 0xe6546b64;
    h ^= chunkIndex * 0x85ebca6b;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0);
  }

  /**
   * Fully re-populates chunk scenery according to its worldZ, district assignment, and deterministic seed
   */
  public decorateChunk(
    chunk: TrackChunk,
    worldZ: number,
    chunkIndex: number,
    options?: {
      forceTheme?: EnvironmentTheme | string;
      forcePortal?: boolean;
      detail?: 'FULL' | 'BALANCED' | 'MINIMAL';
    }
  ): void {
    const isTunnel = !!chunk.isTunnel;
    const tunnelPortal = chunk.tunnelPortal || 'NONE';

    // 1. Determine District & Portal
    let districtId: EnvironmentId;
    let isPortal = false;

    if (options?.forcePortal !== undefined) {
      isPortal = options.forcePortal;
    }

    if (options?.forceTheme) {
      if (typeof options.forceTheme === 'string') {
        districtId = options.forceTheme as EnvironmentId;
      } else {
        districtId = options.forceTheme.id;
      }
    } else {
      const info = this.planner.getDistrictAtZ(worldZ);
      districtId = info.districtId;
      if (options?.forcePortal === undefined) {
        isPortal = info.isPortal;
      }
    }

    const theme = this.registry.get(districtId);
    chunk.currentTheme = theme;
    chunk.isTransitionPortal = isPortal;

    // 2. Compute Deterministic Scenery Seed
    const seed = this.computeScenerySeed(chunkIndex, worldZ);
    (chunk as any).scenerySeed = seed;

    // 3. Build Scenery via SceneryFactory
    const detail = options?.detail || 'FULL';
    this.factory.buildScenery(
      chunk.decorativeGroup,
      theme,
      worldZ,
      isPortal,
      isTunnel,
      tunnelPortal,
      detail,
      seed
    );

    // Track active chunk metadata for diagnostics
    this.activeChunksMeta.set(chunkIndex, {
      chunkZ: worldZ,
      chunkIndex,
      seed,
      districtId,
      isPortal
    });
  }

  /**
   * Smoothly updates atmospheric sky, fog, and lighting based on player's position
   */
  public updateAtmosphere(playerZ: number, worldScene: WorldScene, dt: number): void {
    const transition = this.planner.getTransitionProgress(playerZ);
    const bus = EventBus.getInstance();

    // Check for transition events
    if (transition.inTransition) {
      if (this.transitionEventEmittedForPortalZ !== transition.portalZ) {
        this.transitionEventEmittedForPortalZ = transition.portalZ;
        bus.emit('ENVIRONMENT_TRANSITION_APPROACHING', {
          from: transition.fromEnv,
          to: transition.toEnv,
          portalZ: transition.portalZ
        });
      }

      // Smooth atmospheric interpolation
      const fromTheme = this.registry.get(transition.fromEnv);
      const toTheme = this.registry.get(transition.toEnv);
      worldScene.applyEnvironment(toTheme, transition.progress, fromTheme);

      // Emitted when crossing the portal
      if (playerZ <= transition.portalZ && this.changedEventEmittedForPortalZ !== transition.portalZ) {
        this.changedEventEmittedForPortalZ = transition.portalZ;
        this.previousActiveDistrict = this.currentActiveDistrict;
        this.currentActiveDistrict = transition.toEnv;
        bus.emit('ENVIRONMENT_CHANGED', transition.toEnv, toTheme);
      }
    } else {
      const activeTheme = this.registry.get(transition.fromEnv);
      if (this.currentActiveDistrict !== transition.fromEnv) {
        this.previousActiveDistrict = this.currentActiveDistrict;
        this.currentActiveDistrict = transition.fromEnv;
        bus.emit('ENVIRONMENT_CHANGED', transition.fromEnv, activeTheme);
      }
      worldScene.applyEnvironment(activeTheme, 1.0);
    }
  }

  public getCurrentDistrict(): EnvironmentId {
    return this.currentActiveDistrict;
  }

  /**
   * Development preview jump to a specific environment
   */
  public jumpToDistrict(envId: EnvironmentId): void {
    this.planner.setDebugOverrideDistrict(envId);
    this.currentActiveDistrict = envId;
    const theme = this.registry.get(envId);
    EventBus.getInstance().emit('ENVIRONMENT_CHANGED', envId, theme);
  }

  public clearDistrictOverride(): void {
    this.planner.setDebugOverrideDistrict(null);
  }

  public recordFrameTime(ms: number): void {
    this.lastFrameTime = ms;
  }

  public getDiagnostics(playerZ: number): EnvironmentDiagnostics {
    const info = this.planner.getDistrictAtZ(playerZ);
    const nextEnv = this.planner.getRegionForZ(playerZ).nextDistrictId;
    const distToTrans = this.planner.getDistanceToNextTransition(playerZ);

    const activeSeeds = Array.from(this.activeChunksMeta.values()).sort((a, b) => b.chunkZ - a.chunkZ);
    const meshCount = this.pool.getActiveMeshCount();

    return {
      currentEnvironment: info.districtId,
      currentRegionIndex: info.regionIndex,
      nextEnvironment: nextEnv,
      distanceToTransition: Math.round(distToTrans),
      activeChunkSeeds: activeSeeds,
      sceneryMeshCount: meshCount,
      estimatedDrawCalls: Math.max(12, Math.floor(meshCount * 0.45)),
      frameTimeMs: Math.round(this.lastFrameTime * 100) / 100
    };
  }
}
