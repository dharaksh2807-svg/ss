import { EventBus, EVENTS } from '../core/EventBus';
import { Player } from '../player/Player';
import { EnvironmentTheme, EnvironmentManager, NEON_INDUSTRIAL_THEME, MODERN_METRO_THEME } from '../environment/EnvironmentConfig';
import { TrackPattern } from './ObstaclePatterns';
import {
  JunctionDef,
  JunctionId,
  RouteBranchId,
  ActiveJunctionState,
  JunctionPersistenceData,
  JunctionPersistenceRecord,
  JunctionRouteRecord
} from './JunctionTypes';
import { JUNCTION_CATALOG } from './JunctionCatalog';
import { JunctionGeometry } from './JunctionGeometry';

const STORAGE_KEY = 'metro_railway_junctions_v1';

export class JunctionDirector {
  private static instance: JunctionDirector;
  private eventBus = EventBus.getInstance();
  private envManager = EnvironmentManager.getInstance();

  private runSeed: number = 10001;
  private currentRngSeed: number = 10001;
  private nextAllowedDistance: number = 280.0; // Distance gate
  private activeJunction: ActiveJunctionState | null = null;
  private forcedJunctionId: JunctionId | null = null;
  private forcedRouteChoice: RouteBranchId | null = null;

  private persistenceData: JunctionPersistenceData = {
    version: 1,
    junctions: {} as any
  };

  private constructor() {
    this.loadPersistence();
  }

  public static getInstance(): JunctionDirector {
    if (!JunctionDirector.instance) {
      JunctionDirector.instance = new JunctionDirector();
    }
    return JunctionDirector.instance;
  }

  // =========================================================================
  // SEED AND RUN LIFECYCLE
  // =========================================================================

  public setRunSeed(seed: number): void {
    this.runSeed = seed;
    this.currentRngSeed = seed ^ 0x51a37c;
  }

  private rng(): number {
    let t = (this.currentRngSeed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public resetRunState(): void {
    this.activeJunction = null;
    this.forcedJunctionId = null;
    this.forcedRouteChoice = null;
    this.nextAllowedDistance = 280.0;
  }

  public forceJunction(id: JunctionId, forcedChoice?: RouteBranchId): void {
    this.forcedJunctionId = id;
    this.forcedRouteChoice = forcedChoice || null;
  }

  public getActiveJunction(): ActiveJunctionState | null {
    return this.activeJunction ? { ...this.activeJunction } : null;
  }

  public getCatalog(): Record<JunctionId, JunctionDef> {
    return JUNCTION_CATALOG;
  }

  // =========================================================================
  // JUNCTION SCHEDULING & CHUNK POPULATION
  // =========================================================================

  /**
   * Evaluates chunk parameters and attempts to schedule a railway junction fork chunk.
   * Returns true if a junction was scheduled on this chunk.
   */
  public tryScheduleJunction(
    chunk: any,
    worldZ: number,
    isTransition: boolean,
    activeRooftopPlan: boolean
  ): boolean {
    const absZ = Math.abs(worldZ);

    // Hard eligibility gates
    if (isTransition || activeRooftopPlan) return false;
    if (this.activeJunction !== null) return false;

    const isForced = this.forcedJunctionId !== null;
    if (!isForced && absZ < this.nextAllowedDistance) {
      return false;
    }

    // Single prototype junction
    const def = JUNCTION_CATALOG.JUNCTION_SWITCHYARD_01;
    if (!def) return false;

    // Build the 3D railway switch visuals on the chunk
    const junctionScenery = JunctionGeometry.getInstance().buildJunctionScenery(def.forkChunkLength);
    chunk.decorativeGroup.add(junctionScenery);

    const isFirst = !this.persistenceData.junctions[def.id];

    this.activeJunction = {
      def,
      state: 'APPROACHING',
      junctionChunkZ: worldZ,
      switchPointZ: worldZ - 38.0, // Switch point is at local Z = -38.0m
      committedRoute: null,
      committedTheme: null,
      remainingBranchChunks: def.branchDurationChunks,
      isFirstDiscovery: isFirst,
      coinsCollectedInBranch: 0
    };

    this.forcedJunctionId = null;

    // Emit approaching event
    this.eventBus.emit(EVENTS.JUNCTION_APPROACHING, {
      id: def.id,
      name: def.name,
      location: def.locationName,
      routeA: def.routeA,
      routeB: def.routeB
    });

    return true;
  }

  // =========================================================================
  // FRAME UPDATE & PLAYER DECISION COMMITMENT
  // =========================================================================

  public update(player: Player, dt: number): void {
    if (!this.activeJunction) return;
    const j = this.activeJunction;
    const def = j.def;
    const playerZ = player.position.z;

    // 1. APPROACHING -> DECISION_ZONE
    if (j.state === 'APPROACHING') {
      if (playerZ <= j.junctionChunkZ) {
        j.state = 'DECISION_ZONE';
        this.eventBus.emit(EVENTS.JUNCTION_DECISION_ZONE, {
          id: def.id,
          name: def.name,
          routeA: def.routeA,
          routeB: def.routeB,
          currentLane: player.currentLane
        });
      }
    }

    // 2. DECISION_ZONE -> COMMITTED
    if (j.state === 'DECISION_ZONE') {
      // Evaluate commitment either when crossing switch point or forced via test
      if (playerZ <= j.switchPointZ || this.forcedRouteChoice !== null) {
        let chosenRoute: RouteBranchId;
        if (this.forcedRouteChoice) {
          chosenRoute = this.forcedRouteChoice;
        } else {
          // Taking Lane 1 commits to Route B (Industrial Overpass)
          // Taking Lane -1 or 0 commits to Route A (Main Metro Line)
          chosenRoute = player.currentLane === 1 ? 'ROUTE_B_INDUSTRIAL_OVERPASS' : 'ROUTE_A_MAIN_METRO';
        }

        const routeDef = chosenRoute === 'ROUTE_A_MAIN_METRO' ? def.routeA : def.routeB;
        j.committedRoute = chosenRoute;
        j.committedTheme = routeDef.themeId;
        j.state = 'COMMITTED';
        j.decisionConfirmedAtZ = playerZ;

        // Apply visual switch blade & signal aspects
        const chunk = playerZ; // signal update
        this.applySwitchVisuals(chosenRoute);

        // Emit commitment event
        this.eventBus.emit(EVENTS.JUNCTION_COMMITTED, {
          junctionId: def.id,
          junctionName: def.name,
          chosenRouteId: routeDef.id,
          chosenRouteName: routeDef.name,
          subtitle: routeDef.subtitle,
          themeId: routeDef.themeId,
          difficulty: routeDef.difficultyRating,
          isFirstDiscovery: !this.persistenceData.junctions[def.id]?.routes[chosenRoute]
        });

        j.state = 'BRANCH_ACTIVE';
      }
    }

    // 3. BRANCH_ACTIVE: Track completion
    if (j.state === 'BRANCH_ACTIVE') {
      // Monitor completion after all branch chunks are consumed
      const branchEndZ = j.junctionChunkZ - (1 + def.branchDurationChunks) * def.forkChunkLength;
      if (playerZ <= branchEndZ) {
        this.handleBranchCompleted(player);
      }
    }
  }

  private applySwitchVisuals(chosenRoute: RouteBranchId): void {
    // Visually update the junction group in the scene
    const geo = JunctionGeometry.getInstance();
    // Locate the junction scenery group in scene
    const scenery = (this.eventBus as any).__activeJunctionGroup;
    if (scenery) {
      geo.updateVisualCommitment(scenery, chosenRoute);
    }
  }

  public onChunkGeneratedForBranch(): void {
    if (this.activeJunction && this.activeJunction.state === 'BRANCH_ACTIVE') {
      this.activeJunction.remainingBranchChunks = Math.max(0, this.activeJunction.remainingBranchChunks - 1);
    }
  }

  public onCoinCollected(): void {
    if (this.activeJunction && this.activeJunction.state === 'BRANCH_ACTIVE') {
      this.activeJunction.coinsCollectedInBranch++;
    }
  }

  private handleBranchCompleted(player: Player): void {
    if (!this.activeJunction || !this.activeJunction.committedRoute) return;
    const j = this.activeJunction;
    const def = j.def;
    const routeDef = j.committedRoute === 'ROUTE_A_MAIN_METRO' ? def.routeA : def.routeB;

    // Update persistence
    const now = Date.now();
    let juncRec = this.persistenceData.junctions[def.id];
    if (!juncRec) {
      juncRec = {
        junctionId: def.id,
        firstDiscoveredAt: now,
        totalTimesEncountered: 1,
        routes: {} as any
      };
      this.persistenceData.junctions[def.id] = juncRec;
    } else {
      juncRec.totalTimesEncountered++;
    }

    let routeRec = juncRec.routes[routeDef.id];
    const isFirstTimeRoute = !routeRec;
    if (!routeRec) {
      routeRec = {
        routeId: routeDef.id,
        firstCompletedAt: now,
        timesCompleted: 1,
        totalCoinsEarned: j.coinsCollectedInBranch,
        bestScoreEarned: routeDef.routeCompletionScoreBonus
      };
      juncRec.routes[routeDef.id] = routeRec;
    } else {
      routeRec.timesCompleted++;
      routeRec.totalCoinsEarned += j.coinsCollectedInBranch;
      routeRec.bestScoreEarned = Math.max(routeRec.bestScoreEarned, routeDef.routeCompletionScoreBonus);
    }

    this.savePersistence();

    // Set cooldown before next junction
    this.nextAllowedDistance = Math.abs(player.position.z) + def.cooldownDistance;

    // Emit route completion event
    this.eventBus.emit(EVENTS.JUNCTION_COMPLETED, {
      junctionId: def.id,
      routeId: routeDef.id,
      routeName: routeDef.name,
      scoreBonus: routeDef.routeCompletionScoreBonus,
      firstDiscoveryBonus: isFirstTimeRoute ? routeDef.firstDiscoveryCoins : 0,
      coinsEarned: j.coinsCollectedInBranch,
      timesCompleted: routeRec.timesCompleted
    });

    this.activeJunction = null;
  }

  // =========================================================================
  // PERSISTENCE
  // =========================================================================

  public getJunctionRecord(id: JunctionId): JunctionPersistenceRecord | null {
    return this.persistenceData.junctions[id] || null;
  }

  public getRouteRecord(junctionId: JunctionId, routeId: RouteBranchId): JunctionRouteRecord | null {
    return this.persistenceData.junctions[junctionId]?.routes[routeId] || null;
  }

  public getAllRecords(): Record<JunctionId, JunctionPersistenceRecord> {
    return { ...this.persistenceData.junctions };
  }

  public resetPersistence(): void {
    this.persistenceData = {
      version: 1,
      junctions: {} as any
    };
    this.savePersistence();
  }

  private loadPersistence(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1) {
            this.persistenceData = parsed;
          }
        }
      }
    } catch (_) {}
  }

  private savePersistence(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.persistenceData));
      }
    } catch (_) {}
  }
}
