import { CONSTANTS, LaneIndex } from '../core/Constants';
import { TrackPattern, PatternObstacle } from './ObstaclePatterns';
import { PatternCollectible } from './CoinPatternLibrary';
import { SecretRouteDef, SecretRouteId } from './SecretRouteTypes';

/**
 * Procedural helper for deterministic random numbers from seed.
 */
function seededRng(seed: number): () => number {
  let s = Math.abs(Math.floor(seed)) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const SECRET_ROUTE_CATALOG: Record<SecretRouteId, SecretRouteDef> = {
  // =========================================================================
  // SECRET 1: Abandoned Metro Platform ("The 1984 Forgotten Platform")
  // =========================================================================
  ABANDONED_METRO_PLATFORM: {
    id: 'ABANDONED_METRO_PLATFORM',
    name: 'Abandoned Metro Platform',
    tagline: 'OLD CROSSING 1984 • DECOMMISSIONED PASSENGER SIDING',
    description: 'A weathered Victorian-era siding hidden behind rusted switches, featuring vintage green tiles, antique gas lamps, and dense coin trails.',
    eligibleDistricts: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL'],
    minProgressionMeters: 250.0,
    cooldownMeters: 450.0,
    appearanceProbability: 0.28,
    lengthMeters: CONSTANTS.CHUNK_LENGTH, // 80m
    entry: {
      lane: -1 as LaneIndex,
      actionRequired: 'LANE_SWITCH',
      hintText: 'Switch to Left Lane for Abandoned Siding',
      signText: 'SIDING 3 • CLOSED 1984'
    },
    exitLane: -1 as LaneIndex,
    rewardConfig: {
      baseBonusScore: 500,
      firstDiscoveryCoins: 50,
      firstDiscoveryScore: 2500,
      coinCount: 42,
      bonusPowerup: 'SNEAKERS',
      achievementId: 'SECRET_ABANDONED_PLATFORM'
    },
    lighting: {
      ambientColor: 0xffb366, // Warm tungsten amber
      ambientIntensity: 0.85,
      fogColor: 0x3d2b1f,
      fogDensity: 0.008,
      accentBeaconColor: 0xff9900
    },
    isJetpackCompatible: true,
    createPattern: (seed: number): TrackPattern => {
      const rng = seededRng(seed);
      const obstacles: PatternObstacle[] = [
        // --- Secret Route Track (Lane -1: Abandoned Platform) ---
        // Predictable wooden crate barrier requiring Jump
        {
          type: 'LOW_BARRIER',
          lane: -1,
          zOffset: 34.0,
          variant: 1
        },
        // Low vintage turnstile hurdle requiring Jump
        {
          type: 'LOW_BARRIER',
          lane: -1,
          zOffset: 56.0,
          variant: 0
        },

        // --- Main Route Bypass (Lanes 0 and 1: Standard Railway) ---
        // Safe, clear bypass allowing players who skip the secret to continue unharmed
        {
          type: 'LOW_BARRIER',
          lane: 0,
          zOffset: 42.0,
          variant: 0
        },
        {
          type: 'HIGH_BARRIER',
          lane: 1,
          zOffset: 48.0
        }
      ];

      // Collectibles: Dense coin trail along the platform + Bonus Super Sneakers
      const collectibles: PatternCollectible[] = [
        // Approach guidance coins leading into Lane -1
        {
          type: 'COIN',
          lane: -1,
          zOffset: 8.0,
          count: 6,
          spacing: 2.2,
          yOffset: 0.85,
          archetype: 'STRAIGHT_TRAIL'
        },
        // Jump arc over first hurdle at z=34m
        {
          type: 'COIN',
          lane: -1,
          zOffset: 30.0,
          count: 5,
          spacing: 1.8,
          isArc: true,
          startYOffset: 0.85,
          endYOffset: 0.85,
          archetype: 'JUMP_ARC'
        },
        // Dense platform coins
        {
          type: 'COIN',
          lane: -1,
          zOffset: 40.0,
          count: 7,
          spacing: 2.0,
          yOffset: 0.85,
          archetype: 'STRAIGHT_TRAIL'
        },
        // Jump arc over second hurdle at z=56m
        {
          type: 'COIN',
          lane: -1,
          zOffset: 52.0,
          count: 5,
          spacing: 1.8,
          isArc: true,
          startYOffset: 0.85,
          endYOffset: 0.85,
          archetype: 'JUMP_ARC'
        },
        // Climax reward trail
        {
          type: 'COIN',
          lane: -1,
          zOffset: 62.0,
          count: 6,
          spacing: 2.0,
          yOffset: 0.85,
          archetype: 'STRAIGHT_TRAIL'
        },
        // Secret Power-up reward waiting near platform exit
        {
          type: 'SNEAKERS',
          lane: -1,
          zOffset: 72.0,
          yOffset: 0.95
        },
        // Parallel baseline coins in main bypass lane (Lane 1)
        {
          type: 'COIN',
          lane: 1,
          zOffset: 16.0,
          count: 8,
          spacing: 2.4,
          yOffset: 0.85,
          archetype: 'STRAIGHT_TRAIL'
        }
      ];

      return {
        name: 'SECRET_ABANDONED_METRO_PLATFORM',
        difficulty: 'INTERMEDIATE',
        obstacles,
        collectibles,
        entryLanes: [-1, 0, 1],
        exitLanes: [-1, 0, 1],
        safeRoutes: 'All lanes physically passable; Lane -1 traverses the secret platform'
      };
    }
  },

  // =========================================================================
  // SECRET 2: Elevated Railway Passage ("Highline Skyway Catwalk")
  // =========================================================================
  ELEVATED_RAILWAY_PASSAGE: {
    id: 'ELEVATED_RAILWAY_PASSAGE',
    name: 'Elevated Railway Passage',
    tagline: 'HIGHLINE SKYWAY • ELEVATED VIADUCT CATWALK',
    description: 'A high-altitude skyway reached via entrance ramp onto train rooftops and steel girder catwalks, offering sweeping skyline vistas and aerial coin arcs.',
    eligibleDistricts: ['MODERN_METRO', 'HISTORIC_QUARTER', 'NEON_INDUSTRIAL'],
    minProgressionMeters: 280.0,
    cooldownMeters: 480.0,
    appearanceProbability: 0.25,
    lengthMeters: CONSTANTS.CHUNK_LENGTH, // 80m
    entry: {
      lane: 0 as LaneIndex,
      actionRequired: 'RAMP_CLIMB',
      hintText: 'Climb Center Ramp for Highline Skyway',
      signText: 'HIGHLINE ROOF ACCESS'
    },
    exitLane: 0 as LaneIndex,
    rewardConfig: {
      baseBonusScore: 750,
      firstDiscoveryCoins: 60,
      firstDiscoveryScore: 3000,
      coinCount: 46,
      bonusPowerup: 'MULTIPLIER',
      achievementId: 'SECRET_ELEVATED_PASSAGE'
    },
    lighting: {
      ambientColor: 0x99ddff, // Bright sky blue / twilight glow
      ambientIntensity: 0.95,
      fogColor: 0x1f2e45,
      fogDensity: 0.005,
      accentBeaconColor: 0x00e5ff
    },
    isJetpackCompatible: true,
    createPattern: (seed: number): TrackPattern => {
      const rng = seededRng(seed);
      const obstacles: PatternObstacle[] = [
        // --- Secret Route: Train Ramp & Roof Consist on Lane 0 ---
        {
          type: 'TRAIN_RAMP',
          lane: 0,
          zOffset: 8.0,
          length: CONSTANTS.TRAIN_SET_TRIPLE_LENGTH,
          hasRamp: true,
          hasExitRamp: true,
          routeGroupId: 'highline_skyway_consist'
        },
        // Rooftop hurdle on train roof requiring Jump
        {
          type: 'ROOFTOP_AC_HURDLE',
          lane: 0,
          zOffset: 38.0
        },

        // --- Main Route Bypass (Lanes -1 and 1 on ground) ---
        // Clean ground bypass with standard hurdles
        {
          type: 'LOW_BARRIER',
          lane: -1,
          zOffset: 32.0,
          variant: 0
        },
        {
          type: 'LOW_BARRIER',
          lane: 1,
          zOffset: 46.0,
          variant: 1
        }
      ];

      // Collectibles: Ramp ascent + rooftop aerial run + climax Multiplier
      const collectibles: PatternCollectible[] = [
        // Ramp incline coins (ground to roof: 0.85m -> 4.35m + 0.85m = 5.2m)
        {
          type: 'COIN',
          lane: 0,
          zOffset: 8.0,
          count: 5,
          spacing: 2.2,
          isRampAscent: true,
          startYOffset: 0.85,
          endYOffset: 5.20,
          archetype: 'RAMP_ASCENT'
        },
        // Elevated train roof straight run
        {
          type: 'COIN',
          lane: 0,
          zOffset: 20.0,
          count: 8,
          spacing: 2.0,
          yOffset: 5.20,
          supportSurface: 'TRAIN_ROOF',
          archetype: 'ROOFTOP_RUN'
        },
        // Jump arc over AC unit at z=38m
        {
          type: 'COIN',
          lane: 0,
          zOffset: 35.0,
          count: 5,
          spacing: 1.6,
          isArc: true,
          startYOffset: 5.20,
          endYOffset: 5.20,
          supportSurface: 'TRAIN_ROOF',
          landingSurface: 'TRAIN_ROOF',
          archetype: 'JUMP_ARC'
        },
        // High-altitude aerial trail
        {
          type: 'COIN',
          lane: 0,
          zOffset: 45.0,
          count: 8,
          spacing: 2.0,
          yOffset: 5.20,
          supportSurface: 'TRAIN_ROOF',
          archetype: 'ROOFTOP_RUN'
        },
        // Climax reward power-up on rooftop before descent
        {
          type: 'MULTIPLIER',
          lane: 0,
          zOffset: 62.0,
          yOffset: 5.30,
          supportSurface: 'TRAIN_ROOF'
        },
        // Descent ramp coins back to ground
        {
          type: 'COIN',
          lane: 0,
          zOffset: 68.0,
          count: 4,
          spacing: 2.2,
          isRampAscent: true,
          startYOffset: 5.20,
          endYOffset: 0.85,
          archetype: 'DESCENT_TRAIL'
        },
        // Ground bypass coins for players who skip the skyway
        {
          type: 'COIN',
          lane: -1,
          zOffset: 12.0,
          count: 6,
          spacing: 2.4,
          yOffset: 0.85,
          archetype: 'STRAIGHT_TRAIL'
        }
      ];

      return {
        name: 'SECRET_ELEVATED_RAILWAY_PASSAGE',
        difficulty: 'ADVANCED',
        obstacles,
        collectibles,
        entryLanes: [-1, 0, 1],
        exitLanes: [-1, 0, 1],
        safeRoutes: 'Lane 0 offers elevated skyway climb; Lanes -1 and 1 provide ground bypass'
      };
    }
  },

  // =========================================================================
  // SECRET 3: Hidden Maintenance Tunnel ("Subway Sector 04 Service Conduit")
  // =========================================================================
  HIDDEN_MAINTENANCE_TUNNEL: {
    id: 'HIDDEN_MAINTENANCE_TUNNEL',
    name: 'Hidden Maintenance Tunnel',
    tagline: 'SECTOR 04 SERVICE CONDUIT • RESTRICTED ACCESS',
    description: 'An electrified industrial tunnel with utility steam pipes, high-voltage junction boxes, glowing cyan LED strip conduits, and a guaranteed high-tier power-up.',
    eligibleDistricts: ['UNDERGROUND_METRO', 'MODERN_METRO', 'NEON_INDUSTRIAL'],
    minProgressionMeters: 300.0,
    cooldownMeters: 500.0,
    appearanceProbability: 0.25,
    lengthMeters: CONSTANTS.CHUNK_LENGTH, // 80m
    entry: {
      lane: 1 as LaneIndex,
      actionRequired: 'LANE_SWITCH',
      hintText: 'Enter Right Lane for Sector 04 Maintenance Conduit',
      signText: 'SECTOR 04 • AUTHORIZED ONLY'
    },
    exitLane: 1 as LaneIndex,
    rewardConfig: {
      baseBonusScore: 1000,
      firstDiscoveryCoins: 75,
      firstDiscoveryScore: 3500,
      coinCount: 50,
      bonusPowerup: 'JETPACK',
      achievementId: 'SECRET_MAINTENANCE_TUNNEL'
    },
    lighting: {
      ambientColor: 0x00ffcc, // Electric cyan / emergency teal
      ambientIntensity: 0.90,
      fogColor: 0x051b24,
      fogDensity: 0.009,
      accentBeaconColor: 0x00f0ff
    },
    isJetpackCompatible: true,
    createPattern: (seed: number): TrackPattern => {
      const rng = seededRng(seed);
      const obstacles: PatternObstacle[] = [
        // --- Secret Route: Maintenance Conduit on Lane 1 ---
        // Industrial low steam pipe requiring Slide
        {
          type: 'HIGH_BARRIER', // Slide-under barrier
          lane: 1,
          zOffset: 36.0
        },
        // Low conduit hurdle requiring Jump
        {
          type: 'LOW_BARRIER',
          lane: 1,
          zOffset: 58.0,
          variant: 1
        },

        // --- Main Route Bypass (Lanes -1 and 0: Open Railway) ---
        {
          type: 'LOW_BARRIER',
          lane: -1,
          zOffset: 40.0,
          variant: 0
        },
        {
          type: 'LOW_BARRIER',
          lane: 0,
          zOffset: 52.0,
          variant: 1
        }
      ];

      // Collectibles: Dense serpentine coin trail + guaranteed Jetpack
      const collectibles: PatternCollectible[] = [
        // Approach guidance into Lane 1
        {
          type: 'COIN',
          lane: 1,
          zOffset: 6.0,
          count: 6,
          spacing: 2.0,
          yOffset: 0.85,
          archetype: 'STRAIGHT_TRAIL'
        },
        // Slide guidance coins under the steam barrier at z=36m (low Y=0.60m)
        {
          type: 'COIN',
          lane: 1,
          zOffset: 32.0,
          count: 5,
          spacing: 1.8,
          yOffset: 0.60,
          isSlideGuidance: true,
          archetype: 'SLIDE_GUIDANCE'
        },
        // Post-slide coin burst
        {
          type: 'COIN',
          lane: 1,
          zOffset: 42.0,
          count: 6,
          spacing: 2.0,
          yOffset: 0.85,
          archetype: 'STRAIGHT_TRAIL'
        },
        // Climax Power-up: Guaranteed Jetpack pickup!
        {
          type: 'JETPACK',
          lane: 1,
          zOffset: 50.0,
          yOffset: 0.95
        },
        // Jump arc over conduit hurdle at z=58m
        {
          type: 'COIN',
          lane: 1,
          zOffset: 54.0,
          count: 5,
          spacing: 1.8,
          isArc: true,
          startYOffset: 0.85,
          endYOffset: 0.85,
          archetype: 'JUMP_ARC'
        },
        // Exit runway coins
        {
          type: 'COIN',
          lane: 1,
          zOffset: 64.0,
          count: 6,
          spacing: 2.0,
          yOffset: 0.85,
          archetype: 'STRAIGHT_TRAIL'
        },
        // Mainline bypass coins
        {
          type: 'COIN',
          lane: 0,
          zOffset: 18.0,
          count: 8,
          spacing: 2.4,
          yOffset: 0.85,
          archetype: 'STRAIGHT_TRAIL'
        }
      ];

      return {
        name: 'SECRET_HIDDEN_MAINTENANCE_TUNNEL',
        difficulty: 'ADVANCED',
        obstacles,
        collectibles,
        entryLanes: [-1, 0, 1],
        exitLanes: [-1, 0, 1],
        isTunnel: false, // High vaulted industrial enclosure handled by SecretRouteScenery
        safeRoutes: 'Lane 1 enters electrified service tunnel; Lanes -1 and 0 provide open rail bypass'
      };
    }
  }
};
