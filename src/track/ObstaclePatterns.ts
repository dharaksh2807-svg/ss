import { CONSTANTS, LaneIndex } from '../core/Constants';
import { ObstacleType } from './ObstacleFactory';
import { PowerupType } from '../player/PowerupManager';
import { ReachabilityValidator, ValidatedPattern } from './ReachabilityValidator';

export type PatternDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'EASY' | 'MEDIUM' | 'HARD';

export interface PatternObstacle {
  type: ObstacleType;
  lane: LaneIndex;
  zOffset: number; // Z distance from chunk start (0 to 80m)
  length?: number;
  hasRamp?: boolean;
  isMoving?: boolean;
  velocityZ?: number;
}

import { CollectibleType } from './CollectibleFactory';

export interface PatternCollectible {
  type: CollectibleType;
  lane: LaneIndex;
  zOffset: number;
  yOffset?: number; // Ground level (0.8), hurdle arch (2.4), or train roof (5.2)
  count?: number; // Row of coins
  spacing?: number;
  isArc?: boolean;
}

export interface TrackPattern {
  name: string;
  difficulty: PatternDifficulty;
  obstacles: PatternObstacle[];
  collectibles: PatternCollectible[];
  entryLanes?: LaneIndex[];
  exitLanes?: LaneIndex[];
  requiredActions?: ('JUMP' | 'SLIDE' | 'LANE_CHANGE')[];
  safeRoutes?: string;
  minReactionDist?: number;
  speedMin?: number;
  speedMax?: number;
}

export const OBSTACLE_PATTERNS: TrackPattern[] = [
  // =========================================================================
  // 1. BEGINNER / EASY PATTERNS (0 - 350m, Speed: 18 - 22 m/s)
  // Clear spacing, single-action mechanics, generous reaction windows
  // =========================================================================

  // 1. Runway Intro (Safe lane teaching)
  {
    name: 'RUNWAY_INTRO',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Jump over center hurdle or shift to left/right lane',
    minReactionDist: 35.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 0, zOffset: 35.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 15.0, count: 6, spacing: 2.2 },
      { type: 'COIN', lane: 0, zOffset: 33.0, yOffset: 2.2, count: 3, spacing: 1.8, isArc: true } // Arch over hurdle
    ]
  },

  // 2. Center Train with Open Flanks
  {
    name: 'CENTER_TRAIN_FLANKS',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Shift left to lane -1 or right to lane 1 before train at z=25m',
    minReactionDist: 30.0,
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 25.0, length: 22.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 20.0, count: 8, spacing: 2.5 },
      { type: 'COIN', lane: 1, zOffset: 20.0, count: 8, spacing: 2.5 },
      { type: 'JETPACK', lane: 1, zOffset: 46.0 }
    ]
  },

  // 3. High Barrier Slide + Low Barrier Jump
  {
    name: 'SLIDE_AND_JUMP_COMBO',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['SLIDE', 'JUMP'],
    safeRoutes: 'Slide under high barrier at z=20m, then jump low barrier at z=52m in center, or flank',
    minReactionDist: 30.0,
    obstacles: [
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 20.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 52.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 16.0, yOffset: 0.6, count: 5, spacing: 2.0 },
      { type: 'COIN', lane: 0, zOffset: 48.0, yOffset: 2.4, count: 4, spacing: 1.8, isArc: true },
      { type: 'MAGNET', lane: -1, zOffset: 35.0 }
    ]
  },

  // 4. Side Barrier Squeeze Intro (Construction Barricade in Lane -1)
  {
    name: 'SIDE_BARRIER_SQUEEZE',
    difficulty: 'BEGINNER',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Stay in Center or Right lane to avoid K-rail barricade at left',
    minReactionDist: 32.0,
    obstacles: [
      { type: 'SIDE_BARRIER', lane: -1, zOffset: 28.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 15.0, count: 10, spacing: 2.2 },
      { type: 'COIN', lane: 1, zOffset: 25.0, count: 6, spacing: 2.0 },
      { type: 'MULTIPLIER', lane: 1, zOffset: 40.0 }
    ]
  },

  // 5. Low Barrier Flanked Hurdles
  {
    name: 'FLANKED_HURDLES',
    difficulty: 'BEGINNER',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Center lane is completely open; left/right lanes have jumping hurdles',
    minReactionDist: 30.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: -1, zOffset: 30.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 30.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 16.0, count: 12, spacing: 2.2 },
      { type: 'COIN', lane: -1, zOffset: 28.0, yOffset: 2.4, count: 3, spacing: 1.8, isArc: true }
    ]
  },

  // =========================================================================
  // 2. INTERMEDIATE / MEDIUM PATTERNS (350 - 900m, Speed: 22 - 28 m/s)
  // Multi-lane decisions, train roofs, oncoming trains, tunnel arches
  // =========================================================================

  // 6. Train with Ramp onto Roof!
  {
    name: 'TRAIN_ROOF_RAMP_RUN',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Ride ramp onto center train roof at z=20m, or take right lane',
    minReactionDist: 28.0,
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 20.0, length: 26.0, hasRamp: true },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 35.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 45.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 24.0, yOffset: 5.2, count: 10, spacing: 2.2 },
      { type: 'SNEAKERS', lane: 0, zOffset: 36.0, yOffset: 5.2 }
    ]
  },

  // 7. Dual Trains with Center Escape Lane
  {
    name: 'DUAL_TRAINS_CENTER_ESCAPE',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [0],
    requiredActions: ['LANE_CHANGE', 'JUMP'],
    safeRoutes: 'Center lane allows safe passage between trains, jump hurdle at z=32m',
    minReactionDist: 26.0,
    obstacles: [
      { type: 'TRAIN', lane: -1, zOffset: 20.0, length: 24.0 },
      { type: 'TRAIN', lane: 1, zOffset: 20.0, length: 24.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 32.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 18.0, count: 12, spacing: 2.2 },
      { type: 'MULTIPLIER', lane: 0, zOffset: 55.0 }
    ]
  },

  // 8. Zig-Zag Weave (Left Train, then Right Train)
  {
    name: 'ZIG_ZAG_WEAVE',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Right lane clear initially, then switch to Left or Center lane past z=40m',
    minReactionDist: 25.0,
    obstacles: [
      { type: 'TRAIN', lane: -1, zOffset: 15.0, length: 20.0 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 20.0 },
      { type: 'TRAIN', lane: 1, zOffset: 46.0, length: 20.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, zOffset: 18.0, count: 6, spacing: 2.0 },
      { type: 'COIN', lane: -1, zOffset: 48.0, count: 6, spacing: 2.0 },
      { type: 'HOVERBOARD', lane: 0, zOffset: 45.0 }
    ]
  },

  // 9. Telegraphed Oncoming Moving Train
  {
    name: 'MOVING_TRAIN_TELEGRAPH',
    difficulty: 'INTERMEDIATE',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Oncoming metro train in Right lane (horn sounds at 65m); evade into Left or Center lane',
    minReactionDist: 35.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 45.0, length: 22.0, isMoving: true, velocityZ: CONSTANTS.MOVING_TRAIN_SPEED },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 28.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 15.0, count: 10, spacing: 2.2 },
      { type: 'COIN', lane: -1, zOffset: 26.0, yOffset: 2.4, count: 3, spacing: 1.8, isArc: true },
      { type: 'SHIELD', lane: 0, zOffset: 42.0 }
    ]
  },

  // 10. Tunnel Archway Clearance Slide
  {
    name: 'TUNNEL_SLIDE_CLEARANCE',
    difficulty: 'INTERMEDIATE',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['SLIDE', 'LANE_CHANGE'],
    safeRoutes: 'Low clearance overhead truss at center z=24m requires slide under, or detour left',
    minReactionDist: 26.0,
    obstacles: [
      { type: 'TUNNEL_ARCH', lane: 0, zOffset: 24.0 },
      { type: 'SIDE_BARRIER', lane: 1, zOffset: 30.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 52.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 18.0, yOffset: 0.6, count: 7, spacing: 1.8 },
      { type: 'COIN', lane: -1, zOffset: 20.0, count: 8, spacing: 2.0 },
      { type: 'MAGNET', lane: -1, zOffset: 45.0 }
    ]
  },

  // =========================================================================
  // 3. ADVANCED / HARD PATTERNS (900 - 1800m, Speed: 28 - 34 m/s)
  // Higher decision density, rapid slide-to-jump, moving trains, paired hazards
  // =========================================================================

  // 11. Triple Track Rhythm Challenge
  {
    name: 'RHYTHM_CHALLENGE',
    difficulty: 'HARD',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['LANE_CHANGE', 'JUMP', 'SLIDE'],
    safeRoutes: 'Evade center train to left/right, clear hurdle or slide under barrier',
    minReactionDist: 24.0,
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 15.0, length: 22.0 },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 22.0 },
      { type: 'HIGH_BARRIER', lane: 1, zOffset: 22.0 },
      { type: 'TRAIN', lane: -1, zOffset: 46.0, length: 22.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 52.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, zOffset: 15.0, count: 8, spacing: 2.2 },
      { type: 'COIN', lane: 0, zOffset: 48.0, count: 8, spacing: 2.2 },
      { type: 'SHIELD', lane: 0, zOffset: 62.0 }
    ]
  },

  // 12. Overhead Tunnel Gantry Run
  {
    name: 'TUNNEL_GANTRY_RUN',
    difficulty: 'HARD',
    entryLanes: [-1, 0, 1],
    exitLanes: [0],
    requiredActions: ['SLIDE', 'JUMP'],
    safeRoutes: 'Slide under high barriers or climb ramp onto center train roof at z=48m',
    minReactionDist: 22.0,
    obstacles: [
      { type: 'TRAIN', lane: 1, zOffset: 15.0, length: 28.0 },
      { type: 'HIGH_BARRIER', lane: -1, zOffset: 20.0 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 30.0 },
      { type: 'TRAIN', lane: 0, zOffset: 48.0, length: 24.0, hasRamp: true }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 18.0, count: 6, spacing: 2.0 },
      { type: 'COIN', lane: 1, zOffset: 52.0, count: 6, spacing: 2.0 },
      { type: 'MAGNET', lane: 0, zOffset: 55.0, yOffset: 5.2 }
    ]
  },

  // 13. Moving Train Intercept & Side Barricade
  {
    name: 'MOVING_TRAIN_INTERCEPT',
    difficulty: 'ADVANCED',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Center moving train rushes forward; side barrier in lane -1 at z=45m; lane 1 clear or jump in -1 early',
    minReactionDist: 28.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 0, zOffset: 48.0, length: 24.0, isMoving: true, velocityZ: CONSTANTS.MOVING_TRAIN_SPEED },
      { type: 'SIDE_BARRIER', lane: -1, zOffset: 42.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 20.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, zOffset: 18.0, yOffset: 2.4, count: 4, spacing: 1.8, isArc: true },
      { type: 'COIN', lane: 1, zOffset: 34.0, count: 8, spacing: 2.0 },
      { type: 'HOVERBOARD', lane: 1, zOffset: 58.0 }
    ]
  },

  // 14. Paired Hazards Squeeze
  {
    name: 'PAIRED_HAZARDS_SQUEEZE',
    difficulty: 'ADVANCED',
    entryLanes: [-1, 0, 1],
    exitLanes: [1],
    requiredActions: ['LANE_CHANGE', 'SLIDE'],
    safeRoutes: 'Train blocks left, tunnel arch blocks center; slide under arch or transition to right lane',
    minReactionDist: 24.0,
    obstacles: [
      { type: 'TRAIN', lane: -1, zOffset: 18.0, length: 28.0 },
      { type: 'TUNNEL_ARCH', lane: 0, zOffset: 22.0 },
      { type: 'SIDE_BARRIER', lane: 0, zOffset: 50.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 36.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 18.0, yOffset: 0.6, count: 6, spacing: 1.8 },
      { type: 'COIN', lane: 1, zOffset: 34.0, yOffset: 2.4, count: 4, spacing: 1.8, isArc: true },
      { type: 'MULTIPLIER', lane: 1, zOffset: 58.0 }
    ]
  },

  // 15. Alternating Obstacles Tempo
  {
    name: 'ALTERNATING_TEMPO',
    difficulty: 'ADVANCED',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP', 'SLIDE', 'LANE_CHANGE'],
    safeRoutes: 'Staggered obstacles: jump at z=18m, slide at z=36m, weave right at z=54m',
    minReactionDist: 22.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: -1, zOffset: 18.0 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 32.0 },
      { type: 'SIDE_BARRIER', lane: 1, zOffset: 48.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 56.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 16.0, count: 6, spacing: 2.0 },
      { type: 'COIN', lane: -1, zOffset: 32.0, count: 6, spacing: 2.0 },
      { type: 'COIN', lane: 1, zOffset: 20.0, count: 6, spacing: 2.0 }
    ]
  },

  // =========================================================================
  // 4. EXPERT PATTERNS (1800m+, Speed: 34 - 38 m/s)
  // Tight, skill-testing, fair multi-step solutions, rewarding mastery
  // =========================================================================

  // 16. Expert Gauntlet: Dive, Weave and Vault
  {
    name: 'EXPERT_DIVE_AND_VAULT',
    difficulty: 'EXPERT',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['SLIDE', 'LANE_CHANGE', 'JUMP'],
    safeRoutes: 'Tunnel arch requires slide at z=18m, then lane shift to center to climb train ramp at z=40m',
    minReactionDist: 20.0,
    obstacles: [
      { type: 'TUNNEL_ARCH', lane: -1, zOffset: 18.0 },
      { type: 'TRAIN', lane: 1, zOffset: 15.0, length: 22.0 },
      { type: 'SIDE_BARRIER', lane: 0, zOffset: 20.0 },
      { type: 'TRAIN', lane: 0, zOffset: 40.0, length: 24.0, hasRamp: true }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 15.0, yOffset: 0.6, count: 6, spacing: 1.8 },
      { type: 'COIN', lane: 0, zOffset: 44.0, yOffset: 5.2, count: 8, spacing: 2.0 },
      { type: 'JETPACK', lane: 0, zOffset: 60.0, yOffset: 5.2 }
    ]
  },

  // 17. Expert Double Moving Train Reflex
  {
    name: 'EXPERT_MOVING_TRAIN_REFLEX',
    difficulty: 'EXPERT',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0],
    requiredActions: ['LANE_CHANGE', 'JUMP'],
    safeRoutes: 'Moving train approaches down Right lane; center has low barrier jump, left lane safe',
    minReactionDist: 22.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 46.0, length: 22.0, isMoving: true, velocityZ: CONSTANTS.MOVING_TRAIN_SPEED },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 24.0 },
      { type: 'HIGH_BARRIER', lane: -1, zOffset: 45.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 22.0, yOffset: 2.4, count: 4, spacing: 1.8, isArc: true },
      { type: 'COIN', lane: -1, zOffset: 18.0, count: 8, spacing: 2.0 },
      { type: 'SHIELD', lane: -1, zOffset: 55.0 }
    ]
  },

  // 18. Expert Tunnel & Train Squeeze
  {
    name: 'EXPERT_TUNNEL_TRAIN_SQUEEZE',
    difficulty: 'EXPERT',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['SLIDE', 'LANE_CHANGE'],
    safeRoutes: 'Stationary train in center; tunnel arch requires slide in left; right lane clear initially',
    minReactionDist: 20.0,
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 16.0, length: 26.0 },
      { type: 'TUNNEL_ARCH', lane: -1, zOffset: 20.0 },
      { type: 'SIDE_BARRIER', lane: 1, zOffset: 44.0 },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 52.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 16.0, yOffset: 0.6, count: 8, spacing: 1.8 },
      { type: 'COIN', lane: 1, zOffset: 18.0, count: 8, spacing: 2.0 },
      { type: 'HOVERBOARD', lane: -1, zOffset: 62.0 }
    ]
  },

  // 19. Precision High-Risk Coin Path (Tempting Skill Route)
  {
    name: 'PRECISION_COIN_RISK_ROUTE',
    difficulty: 'EXPERT',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP', 'SLIDE'],
    safeRoutes: 'Left lane is wide open with basic coins; center has high-speed hurdle + slide combo with double multiplier and massive coin arc',
    minReactionDist: 20.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 0, zOffset: 18.0 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 38.0 },
      { type: 'TRAIN', lane: 1, zOffset: 20.0, length: 24.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 16.0, count: 10, spacing: 2.2 },
      { type: 'COIN', lane: 0, zOffset: 16.0, yOffset: 2.5, count: 5, spacing: 1.8, isArc: true },
      { type: 'COIN', lane: 0, zOffset: 34.0, yOffset: 0.6, count: 6, spacing: 1.8 },
      { type: 'MULTIPLIER', lane: 0, zOffset: 52.0 }
    ]
  }
];

/**
 * Automated Feasibility Validator:
 * Bridges to the physical ReachabilityValidator, ensuring 100% human solvability across all speeds.
 */
export function validatePatternFeasibility(
  pattern: TrackPattern,
  speed: number = CONSTANTS.INITIAL_SPEED
): { solvable: boolean; reason?: string } {
  return ReachabilityValidator.validatePattern(pattern as ValidatedPattern, speed);
}
