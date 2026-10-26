import { JunctionDef, JunctionId } from './JunctionTypes';

export const JUNCTION_CATALOG: Record<JunctionId, JunctionDef> = {
  JUNCTION_SWITCHYARD_01: {
    id: 'JUNCTION_SWITCHYARD_01',
    name: 'Grand Central Switchyard',
    locationName: 'Sector 4 Railway Turnout & Freight Divergence',
    minProgressionDistance: 280.0,
    cooldownDistance: 500.0,
    forkChunkLength: 80.0,
    branchDurationChunks: 3, // 3 consecutive chunks (240m) of route-specific gameplay
    
    // -------------------------------------------------------------
    // Route A: Mainline Metro Track (Safe / Moderate Reward)
    // -------------------------------------------------------------
    routeA: {
      id: 'ROUTE_A_MAIN_METRO',
      name: 'Central Metro Mainline',
      subtitle: 'Daylight Express Corridor',
      description: 'Safer high-speed metropolitan line. Balanced obstacle distribution, predictable train schedules, and clean coin trails.',
      recommendedLane: 0,
      eligibleLanes: [-1, 0],
      themeId: 'MODERN_METRO',
      difficultyRating: 'MODERATE',
      
      movingTrainFrequencyMultiplier: 0.85,
      obstacleComplexity: 'BALANCED',
      coinDensityMultiplier: 1.0,
      rooftopOpportunityRate: 0.25,
      
      routeCompletionScoreBonus: 500,
      firstDiscoveryCoins: 25
    },

    // -------------------------------------------------------------
    // Route B: Neon Industrial Overpass (High Risk / High Reward)
    // -------------------------------------------------------------
    routeB: {
      id: 'ROUTE_B_INDUSTRIAL_OVERPASS',
      name: 'Industrial Freight Overpass',
      subtitle: 'High-Voltage Nocturnal Rail Yard',
      description: 'Challenging industrial bypass across heavy freight tracks and elevated train roofs. Demands sharp timing but rewards rich coin yields and a guaranteed 2x multiplier.',
      recommendedLane: 1,
      eligibleLanes: [1],
      themeId: 'NEON_INDUSTRIAL',
      difficultyRating: 'CHALLENGING',
      
      movingTrainFrequencyMultiplier: 1.45,
      obstacleComplexity: 'HIGH_INTENSITY',
      coinDensityMultiplier: 1.55,
      rooftopOpportunityRate: 0.85,
      guaranteedPowerup: 'SCORE_MULTIPLIER',
      
      routeCompletionScoreBonus: 1200,
      firstDiscoveryCoins: 50
    }
  }
};
