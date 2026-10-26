import { EnvironmentId } from '../environment/EnvironmentConfig';
import { LaneIndex } from '../core/Constants';

export type JunctionId = 'JUNCTION_SWITCHYARD_01';
export type RouteBranchId = 'ROUTE_A_MAIN_METRO' | 'ROUTE_B_INDUSTRIAL_OVERPASS';

export type JunctionState = 
  | 'IDLE'            // Normal track before junction approach
  | 'APPROACHING'     // Within visual range of switch signals and gantry (~60-120m ahead)
  | 'DECISION_ZONE'   // Inside the fork chunk before the physical switch point
  | 'COMMITTED'       // Player crossed switch point; branch locked
  | 'BRANCH_ACTIVE'   // Running down the chosen branch chunks
  | 'RECONVERGING'    // Merging back to standard procedural track
  | 'COMPLETED';      // Route completed

export interface RouteOptionDef {
  id: RouteBranchId;
  name: string;
  subtitle: string;
  description: string;
  recommendedLane: LaneIndex; // Lane guiding into this branch (-1/0 for A, 1 for B)
  eligibleLanes: LaneIndex[];
  themeId: EnvironmentId;
  difficultyRating: 'MODERATE' | 'CHALLENGING' | 'EXPERT';
  
  // Gameplay Modifiers
  movingTrainFrequencyMultiplier: number;
  obstacleComplexity: 'BALANCED' | 'HIGH_INTENSITY';
  coinDensityMultiplier: number;
  rooftopOpportunityRate: number; // 0.0 to 1.0 probability of elevated train traversal
  guaranteedPowerup?: 'JETPACK' | 'SUPER_SNEAKERS' | 'SCORE_MULTIPLIER' | 'MAGNET';
  
  // Reward configuration
  routeCompletionScoreBonus: number;
  firstDiscoveryCoins: number;
}

export interface JunctionDef {
  id: JunctionId;
  name: string;
  locationName: string;
  minProgressionDistance: number; // Minimum distance (meters) before junction can spawn
  cooldownDistance: number;       // Distance after completing branch before next junction
  forkChunkLength: number;        // Length of the turnout/fork chunk (typically 80m)
  branchDurationChunks: number;   // Number of distinct chunks the chosen route lasts (3-4 chunks = 240-320m)
  
  routeA: RouteOptionDef;
  routeB: RouteOptionDef;
}

export interface ActiveJunctionState {
  def: JunctionDef;
  state: JunctionState;
  junctionChunkZ: number;         // Start Z of the junction fork chunk
  switchPointZ: number;           // Exact Z where the tracks physically diverge (-40m into chunk)
  committedRoute: RouteBranchId | null;
  committedTheme: EnvironmentId | null;
  remainingBranchChunks: number;
  isFirstDiscovery: boolean;
  coinsCollectedInBranch: number;
  decisionConfirmedAtZ?: number;
}

export interface JunctionRouteRecord {
  routeId: RouteBranchId;
  firstCompletedAt: number;
  timesCompleted: number;
  totalCoinsEarned: number;
  bestScoreEarned: number;
}

export interface JunctionPersistenceRecord {
  junctionId: JunctionId;
  firstDiscoveredAt: number;
  totalTimesEncountered: number;
  routes: Record<RouteBranchId, JunctionRouteRecord>;
}

export interface JunctionPersistenceData {
  version: number;
  junctions: Record<JunctionId, JunctionPersistenceRecord>;
}
