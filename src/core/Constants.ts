export const CONSTANTS = {
  // World scale and lanes
  LANE_WIDTH: 3.6, // Width of each lane in meters/units
  LANE_INDICES: [-1, 0, 1] as const,
  LANE_POSITIONS: [-3.6, 0, 3.6] as const,
  LANES: {
    [-1]: -3.6,
    [0]: 0,
    [1]: 3.6
  } as Record<LaneIndex, number>,
  LANE_CHANGE_DURATION: 0.18, // Snappy 180ms lane change
  LANE_BANK_ANGLE: 0.14, // Lateral banking tilt angle in radians

  // Player Physics & Locomotion
  PLAYER_BASE_Y: 0.9, // Ground level player pivot
  PLAYER_WIDTH: 0.9,
  PLAYER_HEIGHT_RUN: 1.8,
  PLAYER_HEIGHT_SLIDE: 0.75,
  PLAYER_DEPTH: 0.8,

  // Authoritative Jump & Slide Physics
  // Ballistic derivation: H = 2.25m, T = 0.60s => g = 8*H/(T^2) = 50.0 m/s^2, v0 = 4*H/T = 15.0 m/s
  // Verified: v0^2 / (2*g) = 225/100 = 2.25m; 2*v0 / g = 30/50 = 0.60s. Zero contradictions.
  JUMP_HEIGHT: 2.25, // Authoritative peak jump height above support surface (meters)
  JUMP_DURATION: 0.60, // Authoritative airtime on flat surface (seconds)
  GRAVITY: 50.0, // Downward acceleration (m/s^2)
  JUMP_INITIAL_VELOCITY: 15.0, // Initial upward velocity at takeoff (m/s)
  SUPER_JUMP_MULTIPLIER: 1.45, // Super sneakers jump height multiplier
  FAST_DROP_SPEED: -26.0, // Fast descent downward velocity when swiping down in air (m/s)
  SLIDE_DURATION: 0.65, // Slide duration in seconds
  LANDING_ABSORB_DURATION: 0.12, // Brief knee-flexion landing absorption window (seconds)

  // Camera Settings (Derived from REA arcade runner composition)
  CAMERA_OFFSET_Y: 3.25, // Height above player support surface (lowers pitch angle from ~30° down to natural 14°)
  CAMERA_OFFSET_Z: 5.60, // Distance behind player (prominent character silhouette without obstructing view)
  CAMERA_LOOK_Y: 1.65, // Look target height above runner
  CAMERA_LOOK_AHEAD_Z: -18.0, // Long-range forward horizon visibility (ahead into oncoming track)
  CAMERA_FOV: 60, // Standard landscape FOV (responsive portrait widens to 68)
  CAMERA_LERP_X: 10.0, // Snappy camera lateral tracking
  CAMERA_LERP_Y: 8.0,
  CAMERA_SHAKE_DECAY: 6.0,

  // Speed and Difficulty Progression
  INITIAL_SPEED: 18.0, // Starting forward speed (m/s)
  MAX_SPEED: 38.0, // Top speed at high distance
  SPEED_ACCELERATION: 0.12, // Legacy speed gain per 100m
  SPEED_LERP: 4.0, // Speed response damping factor

  // Mode-Specific Speed Progression Profiles
  SPEED_PROFILES: {
    NORMAL: {
      initialSpeed: 18.0,
      maxSpeed: 38.0,
      earlyRampDistance: 300.0, // 0 - 300m (~12-14s)
      earlySpeedTarget: 24.5,
      midRampDistance: 1200.0, // 300 - 1200m (~15s to ~45s)
      midSpeedTarget: 31.5,
      asymptoticDistance: 3200.0
    },
    HARD: {
      initialSpeed: 24.0,
      maxSpeed: 46.0,
      earlyRampDistance: 250.0,
      earlySpeedTarget: 31.0,
      midRampDistance: 1000.0,
      midSpeedTarget: 39.5,
      asymptoticDistance: 2600.0
    },
    SURVIVAL: {
      initialSpeed: 25.0,
      maxSpeed: 40.0,
      earlyRampDistance: 250.0,
      earlySpeedTarget: 30.0,
      midRampDistance: 900.0,
      midSpeedTarget: 36.0,
      asymptoticDistance: 2400.0
    },
    TIME_TRIAL: {
      initialSpeed: 22.0,
      maxSpeed: 38.0,
      earlyRampDistance: 250.0,
      earlySpeedTarget: 27.5,
      midRampDistance: 1000.0,
      midSpeedTarget: 34.0,
      asymptoticDistance: 2600.0
    },
    COIN_RUSH: {
      initialSpeed: 18.0,
      maxSpeed: 32.0,
      earlyRampDistance: 350.0,
      earlySpeedTarget: 22.5,
      midRampDistance: 1400.0,
      midSpeedTarget: 28.0,
      asymptoticDistance: 3000.0
    }
  },

  // Data-Driven Difficulty Balancing Configuration
  DIFFICULTY_CONFIG: {
    MIN_SAFE_REACTION_TIME: 0.55, // Minimum seconds of reaction window at any speed
    CONSECUTIVE_DIFFICULT_MAX: 2, // Max consecutive intense chunks before breather
    MOVING_TRAIN_MIN_GAP: 75.0, // Minimum meters between moving train spawns
    MOVING_TRAIN_MIN_TIME_GAP: 3.5, // Minimum seconds between moving train encounters
    BREATHER_INTERVAL: 4, // Guaranteed breather opportunity every ~4-5 chunks
  },

  // Encounter targets are arrival times, independent of chunk streaming lead distance.
  TRAIN_ENCOUNTER_PACING: {
    firstNormal: [7.0, 9.0],
    firstHard: [6.0, 7.5],
    stages: [
      { end: 300, normalGap: [7.5, 10], hardGap: [6.5, 8], normalStaticGap: [14, 20], hardStaticGap: [12, 17] },
      { end: 1200, normalGap: [4.2, 5.3], hardGap: [3.5, 4.5], normalStaticGap: [7, 10], hardStaticGap: [6, 8] },
      { end: 2500, normalGap: [3.5, 4.5], hardGap: [2.9, 3.7], normalStaticGap: [7, 10], hardStaticGap: [4.5, 6] },
      { end: Infinity, normalGap: [2.8, 3.6], hardGap: [2.4, 3.0], normalStaticGap: [4.5, 6], hardStaticGap: [4.5, 6.5] }
    ],
    rushNormalDistance: 1200,
    rushHardDistance: 900,
    rushChance: 0.18,
    rushCooldown: 28,
    rushPairGap: 2.4,
    minimumArrivalGap: 1.9,
    placementTolerance: 0.6
  },

  // Dynamic Moving Train Speed Progression Profiles
  TRAIN_SPEED_PROFILES: {
    NORMAL: {
      baseSpeed: 20.0,
      earlySpeed: 22.0,     // 250m
      mediumSpeed: 26.0,    // 750m
      advancedSpeed: 30.0,  // 1600m
      expertSpeed: 31.5,
      maxSpeed: 32.0,
      variationRange: 0.8,
      minTimeGap: 4.0,
      minTimeGapLate: 2.2,
    },
    HARD: {
      baseSpeed: 26.0,
      earlySpeed: 28.0,
      mediumSpeed: 33.0,
      advancedSpeed: 38.0,
      expertSpeed: 41.0,
      maxSpeed: 42.0,
      variationRange: 1.0,
      minTimeGap: 2.8,
      minTimeGapLate: 1.8,
    },
    SURVIVAL: {
      baseSpeed: 12.5,
      earlySpeed: 13.5,
      mediumSpeed: 16.0,
      advancedSpeed: 18.0,
      expertSpeed: 20.0,
      maxSpeed: 20.0,
      variationRange: 0.8,
      minTimeGap: 3.5,
      minTimeGapLate: 2.0,
    },
    TIME_TRIAL: {
      baseSpeed: 12.0,
      earlySpeed: 13.0,
      mediumSpeed: 15.5,
      advancedSpeed: 17.5,
      expertSpeed: 19.0,
      maxSpeed: 19.5,
      variationRange: 0.8,
      minTimeGap: 3.5,
      minTimeGapLate: 2.0,
    },
    COIN_RUSH: {
      baseSpeed: 10.0,
      earlySpeed: 11.0,
      mediumSpeed: 13.0,
      advancedSpeed: 15.0,
      expertSpeed: 16.0,
      maxSpeed: 16.5,
      variationRange: 0.6,
      minTimeGap: 4.5,
      minTimeGapLate: 2.5,
    }
  },

  // Track Chunks & Procedural Generation
  CHUNK_LENGTH: 80.0, // Length of each track segment in meters
  ACTIVE_CHUNKS: 6, // Number of concurrent chunks in scene (~480m view distance)
  DESPAWN_DISTANCE_BEHIND: 40.0, // Distance behind player before recycling chunk

  // Obstacle Dimensions
  TRAIN_WIDTH: 3.1,
  TRAIN_HEIGHT: 4.2,
  TRAIN_LENGTH_SHORT: 16.0,
  TRAIN_LENGTH_MEDIUM: 22.0,
  TRAIN_LENGTH_LONG: 28.0,
  TRAIN_RAMP_LENGTH: 8.0, // Ramp to run up onto train roof!
  TRAIN_ROOF_SURFACE_Y: 4.35, // Exact walkable roof surface (4.2m height + 0.15m catwalk)
  CARRIAGE_LENGTH_SHORT: 16.0,
  CARRIAGE_LENGTH_MEDIUM: 18.0,
  CARRIAGE_LENGTH_LONG: 22.0,
  CARRIAGE_GANGWAY_LENGTH: 1.2,
  TRAIN_SET_TWIN_LENGTH: 37.2,
  TRAIN_SET_TRIPLE_LENGTH: 52.4,
  TRAIN_SET_MEDIUM_LENGTH: 52.4,
  TRAIN_SET_QUAD_LENGTH: 69.6,
  ROOFTOP_AC_HURDLE_HEIGHT: 0.65,
  ROOFTOP_VENT_HEIGHT: 0.50,
  MOVING_TRAIN_SPEED: 20.0, // Velocity of oncoming train relative to track
  MOVING_TRAIN_TELEGRAPH_DIST: 65.0, // Minimum distance for steady headlights and horn
  MOVING_TRAIN_WARNING_TIME: 2.0, // Seconds of warning at actual closing velocity
  LOW_BARRIER_HEIGHT: 1.1, // Must jump over (cannot slide under)
  MEDIUM_BARRIER_HEIGHT: 1.65, // Must peak jump or lane change (cannot slide under)
  HIGH_BARRIER_CLEARANCE: 1.40, // Must slide under (jumping hits overhead beam; raised to 1.40m for optimal readability)
  HIGH_BARRIER_HEIGHT: 4.05, // Substantial train-height overhead gantry (train height is 4.2m)
  PILLAR_WIDTH: 0.9, // Structural column width/diameter
  PILLAR_HEIGHT: 7.6, // Structural pillar height extending to ceiling
  TUNNEL_CEILING_HEIGHT: 7.6, // Vaulted tunnel ceiling height (guarantees camera & jump clearance)
  TUNNEL_AERIAL_VAULT_HEIGHT: 12.5, // High-clearance aerial passage vaulted ceiling (clears 9.0m flight & 11.4m camera)
  TUNNEL_WALL_X: 5.8, // Lateral position of continuous tunnel walls
  MOVING_TRAIN_ACTIVATION_DIST: 85.0, // Distance ahead of player where oncoming train begins approach
  SIDE_BARRIER_WIDTH: 1.9,
  SIDE_BARRIER_HEIGHT: 2.2,
  TUNNEL_ARCH_HEIGHT: 2.9,
  TUNNEL_ARCH_CLEARANCE: 1.7,

  // Stumble & Skilled Play Mechanics
  STUMBLE_SPEED_DROP: 0.22, // Speed drop percentage upon glancing side collision
  STUMBLE_DURATION: 0.7, // Recovery time in seconds from stumble
  CLEAN_STREAK_BONUS: 150, // Bonus score per clean obstacle chunk passed
  PRECISION_ACTION_BONUS: 80, // Bonus score for clutch jump/slide evasion

  // Collectibles & Powerups
  COIN_RADIUS: 0.45,
  COIN_PICKUP_RADIUS: 1.1, // Effective 3D pickup collision radius (runner volume + coin volume)
  COIN_ROTATION_SPEED: 2.2, // Smooth, non-flickering rotation presenting face clearly
  COIN_VFX_DURATION: 0.25, // Duration of pickup sparkle burst in seconds
  COIN_GROUND_Y: 0.85, // Standard running collection height
  COIN_SLIDE_Y: 0.60, // Low-profile slide guidance collection height
  COIN_JUMP_PEAK_Y: 3.10, // Physically calibrated apex height for hurdle jump arcs (0.85m ground + 2.25m jump height)
  COIN_ROOFTOP_Y: 5.20, // Walkable train roof collection height (train roof 4.35m + 0.85m)
  COIN_DEFAULT_SPACING: 2.2, // Default spacing between consecutive coins
  COIN_ARC_SPACING: 1.8, // Spacing for readable parabolic jump arcs
  COIN_RISK_REWARD_RATIO: 1.75, // Configurable reward multiplier for high-skill risk paths
  COIN_POST_OBSTACLE_COUNT: 4, // Number of coins in post-obstacle reward burst
  MAGNET_RADIUS: 12.0,
  MAGNET_PULL_SPEED: 28.0,
  POWERUP_DURATION: 12.0, // 12 seconds active duration for magnet/sneakers/2x
  HOVERBOARD_DURATION: 20.0, // 20 seconds hoverboard duration
  HOVERBOARD_DOUBLE_TAP_WINDOW: 0.35, // Seconds for double-tap detection

  // Jetpack Flight & Aerial System
  JETPACK_ALTITUDE: 9.0, // High-altitude flight cruising level above ground
  JETPACK_TAKEOFF_DURATION: 0.65, // Smooth transition time from ground to flight altitude (seconds)
  JETPACK_DESCENT_DURATION: 1.8, // Smooth transition time from flight altitude to ground (seconds)
  JETPACK_COIN_SPACING: 2.2, // Meters between aerial coins along flight path
  JETPACK_SAFE_LANDING_RUNWAY: 35.0, // Guaranteed obstacle-free touchdown runway length (meters)
  JETPACK_AERIAL_POOL_SIZE: 160, // Size of pre-allocated aerial coin pool

  // World Bending Vertex Shader
  CURVE_X: 0.00035, // Horizontal curve intensity
  CURVE_Y: -0.00045, // Vertical horizon dip intensity

  // Scoring
  SCORE_PER_METER: 1.0,
  COIN_SCORE_VALUE: 50,
  NEAR_MISS_SCORE: 100,

  // Colors Palette (Vibrant Stylized Arcade)
  COLORS: {
    SKY_TOP: 0x0288d1, // Rich vibrant azure sky blue
    SKY_BOTTOM: 0xe1f5fe, // Sunny morning horizon cyan
    FOG: 0xb3e5fc, // Soft atmospheric aerial blue haze
    BALLAST: 0x2c2738,
    SLEEPER: 0x42362b,
    RAIL: 0xd0d5dd,
    RAIL_GLOW: 0x00f0ff,
    TRAIN_BODY_1: 0xd32f2f, // Cherry Red Express
    TRAIN_BODY_2: 0x0288d1, // Cyan Metro Line
    TRAIN_BODY_3: 0xff8f00, // Amber City Transit
    TRAIN_ROOF: 0x373b44,
    BARRIER_STRIPE_1: 0xffcc00,
    BARRIER_STRIPE_2: 0x1f232b,
    COIN_GOLD: 0xffd700,
    COIN_RIM: 0xffaa00,
    BUILDING_1: 0xc0392b, // Terracotta red brick
    BUILDING_2: 0x2c3e50, // Slate navy commercial
    BUILDING_3: 0xd35400, // Warm amber brick
    BUILDING_4: 0x7f8c8d, // Concrete industrial
    NEON_CYAN: 0x00ffff,
    NEON_MAGENTA: 0xff007f,
    HOVERBOARD: 0x00e676,
    SNEAKERS: 0xff1744,
    MAGNET: 0x2979ff
  }
} as const;

export type LaneIndex = -1 | 0 | 1; // -1: Left, 0: Center, 1: Right

export function getLaneX(lane: LaneIndex): number {
  return lane * CONSTANTS.LANE_WIDTH;
}
