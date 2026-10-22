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

  // Camera Settings (Derived from REA measurements and normalized)
  CAMERA_OFFSET_Y: 4.8, // Height above player
  CAMERA_OFFSET_Z: 6.8, // Distance behind player
  CAMERA_LOOK_Y: 2.0, // Look target height above player
  CAMERA_LOOK_AHEAD_Z: -12.0, // Look ahead distance
  CAMERA_FOV: 65,
  CAMERA_LERP_X: 10.0, // Snappy camera tracking
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
    BREATHER_INTERVAL: 4, // Guaranteed breather opportunity every ~4-5 chunks
  },

  // Track Chunks & Procedural Generation
  CHUNK_LENGTH: 80.0, // Length of each track segment in meters
  ACTIVE_CHUNKS: 6, // Number of concurrent chunks in scene (~480m view distance)
  DESPAWN_DISTANCE_BEHIND: 40.0, // Distance behind player before recycling chunk

  // Obstacle Dimensions
  TRAIN_WIDTH: 3.1,
  TRAIN_HEIGHT: 4.2,
  TRAIN_LENGTH_SHORT: 16.0,
  TRAIN_LENGTH_LONG: 28.0,
  TRAIN_RAMP_LENGTH: 8.0, // Ramp to run up onto train roof!
  MOVING_TRAIN_SPEED: 11.0, // Velocity of oncoming train relative to track
  MOVING_TRAIN_TELEGRAPH_DIST: 65.0, // Distance to flash headlights & sounding horn
  LOW_BARRIER_HEIGHT: 1.1, // Must jump over
  HIGH_BARRIER_CLEARANCE: 1.25, // Must slide under
  HIGH_BARRIER_HEIGHT: 3.5,
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
  COIN_ROTATION_SPEED: 2.2, // Smooth, non-flickering rotation presenting face clearly
  COIN_VFX_DURATION: 0.25, // Duration of pickup sparkle burst in seconds
  MAGNET_RADIUS: 12.0,
  MAGNET_PULL_SPEED: 28.0,
  POWERUP_DURATION: 12.0, // 12 seconds active duration for magnet/sneakers/2x
  HOVERBOARD_DURATION: 20.0, // 20 seconds hoverboard duration
  HOVERBOARD_DOUBLE_TAP_WINDOW: 0.35, // Seconds for double-tap detection

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
