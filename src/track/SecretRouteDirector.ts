import { CONSTANTS, LaneIndex } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { EnvironmentTheme } from '../environment/EnvironmentConfig';
import { Player } from '../player/Player';
import { ProgressionManager } from '../progression/ProgressionManager';
import { ReachabilityValidator } from './ReachabilityValidator';
import { SECRET_ROUTE_CATALOG } from './SecretRouteCatalog';
import { SecretRouteScenery } from './SecretRouteScenery';
import { TrackPattern } from './ObstaclePatterns';
import {
  SecretRouteId,
  SecretRouteDef,
  SecretRouteDiscoveryRecord,
  SecretRoutePersistenceData,
  ActiveSecretRouteState
} from './SecretRouteTypes';

const STORAGE_KEY = 'metro_secret_routes_v1';

export class SecretRouteDirector {
  private static instance: SecretRouteDirector;
  private eventBus = EventBus.getInstance();

  // Run and deterministic state
  private runSeed: number = 1337;
  private nextAllowedZ: number = 240.0; // Initial distance threshold before first secret route
  private lastRouteZ: number = 999999;
  private activeRoute: ActiveSecretRouteState | null = null;
  private routeHistory: Map<SecretRouteId, number> = new Map(); // id -> lastWorldZ

  // Forced debug overrides for targeted tests
  private forcedRouteId: SecretRouteId | null = null;
  private forcedSeed: number | null = null;

  // Persistence state
  private persistenceData: SecretRoutePersistenceData;

  private constructor() {
    this.persistenceData = this.loadPersistence();
  }

  public static getInstance(): SecretRouteDirector {
    if (!SecretRouteDirector.instance) {
      SecretRouteDirector.instance = new SecretRouteDirector();
    }
    return SecretRouteDirector.instance;
  }

  public setRunSeed(seed: number): void {
    this.runSeed = seed;
    this.resetRunState();
  }

  public resetRunState(): void {
    this.nextAllowedZ = 240.0;
    this.lastRouteZ = 999999;
    this.activeRoute = null;
    this.routeHistory.clear();
    this.forcedRouteId = null;
    this.forcedSeed = null;
  }

  public forceEncounter(routeId: SecretRouteId, seed?: number): void {
    this.forcedRouteId = routeId;
    if (seed !== undefined) {
      this.forcedSeed = seed;
    }
  }

  public getActiveRoute(): ActiveSecretRouteState | null {
    return this.activeRoute;
  }

  // =========================================================================
  // SCHEDULING AND GENERATION
  // =========================================================================

  /**
   * Evaluates chunk parameters and attempts to schedule a rare secret route encounter.
   * Returns TrackPattern if a secret route was successfully populated on the chunk, or null otherwise.
   */
  public tryScheduleSecretRoute(
    chunk: any,
    worldZ: number,
    theme: EnvironmentTheme,
    isTransition: boolean,
    playerSpeed: number,
    mode: string = 'NORMAL',
    flightActive: boolean = false
  ): TrackPattern | null {
    const absZ = Math.abs(worldZ);

    // Hard eligibility gates
    if (isTransition) return null;
    if (this.activeRoute !== null) return null;

    // Check distance and cooldown unless forced via debug
    const isForced = this.forcedRouteId !== null;
    if (!isForced && absZ < this.nextAllowedZ) {
      return null;
    }

    // Determine candidate secret route
    let targetDef: SecretRouteDef | null = null;
    if (isForced) {
      targetDef = SECRET_ROUTE_CATALOG[this.forcedRouteId!];
      this.forcedRouteId = null;
    } else {
      // Find all encounters eligible for this environment
      const candidates = Object.values(SECRET_ROUTE_CATALOG).filter((def) => {
        if (!def.eligibleDistricts.includes(theme.id)) return false;
        if (flightActive && !def.isJetpackCompatible) return false;

        // Check per-route cooldown
        const lastSpawn = this.routeHistory.get(def.id) ?? 999999;
        if (absZ - lastSpawn < def.cooldownMeters) return false;

        return true;
      });

      if (candidates.length === 0) return null;

      // Seeded random selection
      const seed = Math.abs(Math.round(worldZ * 37 + this.runSeed)) % 2147483647;
      const roll = (seed % 1000) / 1000.0;

      // Check appearance probability
      const primaryCandidate = candidates[seed % candidates.length];
      if (roll > primaryCandidate.appearanceProbability) {
        return null;
      }
      targetDef = primaryCandidate;
    }

    if (!targetDef) return null;

    const encounterSeed = this.forcedSeed !== null ? this.forcedSeed : (Math.abs(Math.round(worldZ * 43 + this.runSeed)) % 2147483647);
    this.forcedSeed = null;

    // 1. Generate pattern from catalog
    const pattern = targetDef.createPattern(encounterSeed);

    // 2. Validate reachability of the pattern
    const proof = ReachabilityValidator.validatePattern(pattern as any, playerSpeed, [-1, 0, 1]);
    if (!proof.solvable) {
      console.warn(`SecretRouteDirector: Reachability proof failed for ${targetDef.id}`);
      return null;
    }

    // 3. Populate chunk with track pattern
    const populated = chunk.populate(pattern, worldZ, theme, false);
    if (!populated) return null;

    // 4. Build 3D architectural scenery in chunk's decorative group
    SecretRouteScenery.getInstance().buildSecretScenery(
      chunk.decorativeGroup,
      targetDef.id,
      chunk.length || CONSTANTS.CHUNK_LENGTH
    );

    // 5. Activate route tracking
    const chunkLength = chunk.length || CONSTANTS.CHUNK_LENGTH;
    const isFirstTime = !this.persistenceData.records[targetDef.id]?.firstDiscoveredAt;

    this.activeRoute = {
      def: targetDef,
      chunkZ: worldZ,
      startWorldZ: worldZ,
      endWorldZ: worldZ - chunkLength,
      entryLane: targetDef.entry.lane,
      exitLane: targetDef.exitLane,
      playerEntered: false,
      isFirstDiscovery: isFirstTime,
      coinsCollectedInRoute: 0,
      completed: false
    };

    this.lastRouteZ = absZ;
    this.routeHistory.set(targetDef.id, absZ);
    this.nextAllowedZ = absZ + targetDef.cooldownMeters;

    // Emit telegraphing discovery event
    this.eventBus.emit(EVENTS.SECRET_ROUTE_DISCOVERED, {
      id: targetDef.id,
      name: targetDef.name,
      entryLane: targetDef.entry.lane,
      hint: targetDef.entry.hintText,
      signText: targetDef.entry.signText,
      worldZ
    });

    return pattern;
  }

  // =========================================================================
  // RUNTIME PLAYER TRACKING & REWARDS
  // =========================================================================

  /**
   * Called every frame from Game loop to track player entry, progress, and exit.
   */
  public update(player: Player, dt: number): void {
    if (!this.activeRoute) return;

    const r = this.activeRoute;
    const playerZ = player.position.z;
    const playerLane = player.currentLane;

    // 1. Check Entry (when player is within the entry window [startWorldZ, startWorldZ - 20m])
    if (!r.playerEntered) {
      const pastStart = playerZ <= r.startWorldZ;
      const beforeMidpoint = playerZ > r.startWorldZ - 25.0;

      if (pastStart && beforeMidpoint) {
        // Player entered secret route if in the required lane, or on train roof for rooftop passage
        const isRooftopRoute = r.def.id === 'ELEVATED_RAILWAY_PASSAGE';
        const inEntryLane = playerLane === r.entryLane;
        const onRooftop = (player as any).supportSurface === 'TRAIN_ROOF' || player.groundY >= 3.5;

        if (inEntryLane || (isRooftopRoute && onRooftop)) {
          r.playerEntered = true;
          this.handlePlayerEntered(player);
        }
      }
    }

    // 2. Check Exit & Completion (when player reaches or passes endWorldZ)
    if (r.playerEntered && !r.completed) {
      if (playerZ <= r.endWorldZ + 2.0) {
        r.completed = true;
        this.handlePlayerCompleted(player);
      }
    }

    // 3. Clear active route when player has completely cleared the chunk
    if (playerZ < r.endWorldZ - 10.0) {
      this.activeRoute = null;
    }
  }

  /**
   * Tracks a coin collected by the player.
   */
  public onCoinCollected(): void {
    if (this.activeRoute && this.activeRoute.playerEntered && !this.activeRoute.completed) {
      this.activeRoute.coinsCollectedInRoute++;
    }
  }

  private handlePlayerEntered(player: Player): void {
    if (!this.activeRoute) return;
    const r = this.activeRoute;
    const def = r.def;

    // Award base bonus score
    const prog = ProgressionManager.getInstance();
    (prog as any).addScore?.(def.rewardConfig.baseBonusScore);

    // If first-time discovery, award first-discovery bonus
    if (r.isFirstDiscovery) {
      (prog as any).addCoins?.(def.rewardConfig.firstDiscoveryCoins);
      (prog as any).addScore?.(def.rewardConfig.firstDiscoveryScore);
    }

    // Emit event for HUD badge, audio, and visual celebration
    this.eventBus.emit(EVENTS.SECRET_ROUTE_ENTERED, {
      id: def.id,
      name: def.name,
      tagline: def.tagline,
      isFirstDiscovery: r.isFirstDiscovery,
      bonusScore: def.rewardConfig.baseBonusScore,
      firstDiscoveryCoins: r.isFirstDiscovery ? def.rewardConfig.firstDiscoveryCoins : 0
    });
  }

  private handlePlayerCompleted(player: Player): void {
    if (!this.activeRoute) return;
    const r = this.activeRoute;
    const def = r.def;

    // Update persistence
    const now = Date.now();
    let record = this.persistenceData.records[def.id];
    if (!record) {
      record = {
        id: def.id,
        firstDiscoveredAt: now,
        timesCompleted: 1,
        totalCoinsCollected: r.coinsCollectedInRoute,
        bestRunScore: def.rewardConfig.baseBonusScore
      };
      this.persistenceData.records[def.id] = record;
      this.persistenceData.totalSecretsFound = Object.keys(this.persistenceData.records).length;
    } else {
      record.timesCompleted++;
      record.totalCoinsCollected += r.coinsCollectedInRoute;
      record.bestRunScore = Math.max(record.bestRunScore, def.rewardConfig.baseBonusScore);
    }

    this.savePersistence();

    // Emit completion event
    this.eventBus.emit(EVENTS.SECRET_ROUTE_COMPLETED, {
      id: def.id,
      name: def.name,
      timesCompleted: record.timesCompleted,
      coinsCollected: r.coinsCollectedInRoute
    });
  }

  // =========================================================================
  // PERSISTENCE STORAGE
  // =========================================================================

  public getDiscoveryRecord(id: SecretRouteId): SecretRouteDiscoveryRecord | null {
    return this.persistenceData.records[id] || null;
  }

  public getAllRecords(): Record<SecretRouteId, SecretRouteDiscoveryRecord> {
    return { ...this.persistenceData.records };
  }

  public getCatalog(): Record<SecretRouteId, SecretRouteDef> {
    return SECRET_ROUTE_CATALOG;
  }

  public getTotalSecretsFound(): number {
    return Object.keys(this.persistenceData.records).length;
  }

  public resetPersistence(): void {
    this.persistenceData = {
      version: 1,
      records: {} as any,
      totalSecretsFound: 0
    };
    this.savePersistence();
  }

  private loadPersistence(): SecretRoutePersistenceData {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1 && parsed.records) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('SecretRouteDirector: Could not read localStorage:', e);
    }

    return {
      version: 1,
      records: {} as any,
      totalSecretsFound: 0
    };
  }

  private savePersistence(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.persistenceData));
      }
    } catch (e) {
      console.warn('SecretRouteDirector: Could not save localStorage:', e);
    }
  }
}
