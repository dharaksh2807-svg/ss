import { CONSTANTS, LaneIndex } from '../core/Constants';
import { ObstacleType } from './ObstacleFactory';
import { ReachabilityValidator, ValidatedPattern } from './ReachabilityValidator';
import { CoinPatternArchetype, PatternCollectible } from './CoinPatternLibrary';

export type { CoinPatternArchetype, PatternCollectible };

import {
  TrainCompositionDef,
  COMMUTER_TWIN_SET,
  METRO_TRIPLE_CONSIST,
  EXPRESS_QUAD_CONSIST,
  DUAL_TRAIN_GAP_HOP
} from './TrainComposition';

export type PatternDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'EASY' | 'MEDIUM' | 'HARD';

export interface PatternObstacle {
  type: ObstacleType;
  lane: LaneIndex;
  zOffset: number; // Z distance from chunk start (0 to 80m)
  length?: number;
  hasRamp?: boolean;
  hasExitRamp?: boolean;
  isMoving?: boolean;
  velocityZ?: number;
  variant?: number;
  composition?: string | TrainCompositionDef;
  carriageGroupId?: string;
  routeGroupId?: string;
  routeLegId?: string;
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
  isBreather?: boolean;
  isOpening?: boolean;
  isTunnel?: boolean;
  tunnelPortal?: 'ENTRY' | 'EXIT' | 'BOTH' | 'NONE';
}

export const OBSTACLE_PATTERNS: TrackPattern[] = [
  // =========================================================================
  // 0. OPENING TEMPLATES LIBRARY (0 - 80m Chunk 0)
  // 8 distinct, beginner-accessible, readable opening experiences
  // =========================================================================

  // 1. Opening Runway (Central coin trail and low hurdle)
  {
    name: 'OPENING_RUNWAY',
    difficulty: 'BEGINNER',
    isOpening: true,
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Center low hurdle at z=28m (jump over or shift left/right); high barrier at z=56m in lane 1',
    minReactionDist: 28.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 0, zOffset: 28.0 },
      { type: 'HIGH_BARRIER', lane: 1, zOffset: 56.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 6.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 25.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, endLane: -1, zOffset: 34.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: -1, zOffset: 46.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, zOffset: 53.4, yOffset: 0.60, count: 4, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' }
    ]
  },

  // 2. Open Center with Left/Right Flank Obstacles
  {
    name: 'OPENING_OPEN_CENTER_FLANKS',
    difficulty: 'BEGINNER',
    isOpening: true,
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Center lane 0 is an open straight runway with clear coins; avoid low hurdle in lane -1 at z=26m and side barrier in lane 1 at z=32m; jump low hurdle at z=58m in center or stay in open side lanes',
    minReactionDist: 26.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: -1, zOffset: 26.0 },
      { type: 'SIDE_BARRIER', lane: 1, zOffset: 32.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 58.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 6.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 26.0, count: 7, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 55.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: -1, zOffset: 36.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, zOffset: 44.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 3. Early Slide Opportunity
  {
    name: 'OPENING_EARLY_SLIDE',
    difficulty: 'BEGINNER',
    isOpening: true,
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['SLIDE'],
    safeRoutes: 'Slide under high overhead gantry in center lane at z=30m guided by low coins, or dodge to clear flanks; hurdle in lane -1 at z=58m',
    minReactionDist: 30.0,
    obstacles: [
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 30.0 },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 58.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 62.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 6.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 26.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 0, zOffset: 38.0, count: 8, spacing: 2.2, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: 1, zOffset: 26.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 4. Side-Lane Coin Reward
  {
    name: 'OPENING_SIDE_REWARD',
    difficulty: 'BEGINNER',
    isOpening: true,
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Center low hurdle at z=28m invites player to switch left into lane -1 for a rich bounty; lane 1 has a stationary train at z=38m',
    minReactionDist: 28.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 0, zOffset: 28.0 },
      { type: 'TRAIN', lane: 1, zOffset: 38.0, length: 22.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 6.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, endLane: -1, zOffset: 25.0, count: 4, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: -1, zOffset: 34.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 25.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 40.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 5. Distant Stationary Train with Sweeping Bypass
  {
    name: 'OPENING_DISTANT_TRAIN',
    difficulty: 'BEGINNER',
    isOpening: true,
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Stationary train blocks center lane 0 with front bumper at z=47m; smooth lane-switch coin trails lead safely into flanking lanes -1 and 1 starting at z=18m; low hurdle in lane 1 at z=72m',
    minReactionDist: 47.0,
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 58.0, length: 22.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 72.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 6.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, endLane: -1, zOffset: 18.0, count: 5, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: -1, zOffset: 28.0, count: 9, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, zOffset: 24.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, zOffset: 69.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' }
    ]
  },

  // 6. Gentle S-Curve Weave
  {
    name: 'OPENING_GENTLE_S_CURVE',
    difficulty: 'BEGINNER',
    isOpening: true,
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Following the gentle S-curve coin trail naturally weaves around offset hurdles in lane 1 (z=26m), lane 0 (z=44m), and lane -1 (z=62m)',
    minReactionDist: 26.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 1, zOffset: 26.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 44.0 },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 62.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 6.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, endLane: -1, zOffset: 25.0, count: 4, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: -1, zOffset: 34.0, count: 4, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, endLane: 1, zOffset: 42.0, count: 5, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 1, zOffset: 52.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 41.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' }
    ]
  },

  // 7. Small Mixed Hurdle Sequence
  {
    name: 'OPENING_MIXED_HURDLE_GATE',
    difficulty: 'BEGINNER',
    isOpening: true,
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Jump low hurdle in center lane at z=28m; medium barrier in lane -1 at z=52m has flashing beacon; low barrier in lane 1 at z=56m; center lane remains completely clear after z=34m',
    minReactionDist: 28.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 0, zOffset: 28.0 },
      { type: 'MEDIUM_BARRIER', lane: -1, zOffset: 52.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 56.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 6.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 25.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 36.0, count: 10, spacing: 2.2, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: -1, zOffset: 26.0, count: 5, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 8. Introductory Train Ramp Route
  {
    name: 'OPENING_INTRO_RAMP',
    difficulty: 'BEGINNER',
    isOpening: true,
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Ground runway in center lane 0 is completely clear; lane 1 has an inviting ramp at z=32m leading onto stationary train rooftop with coins; low barrier in lane -1 at z=58m',
    minReactionDist: 32.0,
    obstacles: [
      { type: 'TRAIN', lane: 1, zOffset: 32.0, length: 24.0, hasRamp: true },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 58.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 6.0, count: 5, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, endLane: 1, zOffset: 25.0, count: 4, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 1, zOffset: 34.0, count: 4, spacing: 2.0, isRampAscent: true, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: 1, zOffset: 44.0, yOffset: 5.2, count: 6, spacing: 2.2, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: -1, zOffset: 26.0, count: 5, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 2. Runway Intro (Safe lane teaching)
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
      { type: 'COIN', lane: 0, zOffset: 14.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 32.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 39.5, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: 1, zOffset: 24.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 3. Center Train with Open Flanks
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
      { type: 'COIN', lane: 0, endLane: 1, zOffset: 12.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: -1, zOffset: 24.0, count: 7, spacing: 2.4, isRiskRoute: false, archetype: 'RISK_REWARD' },
      { type: 'COIN', lane: 1, zOffset: 24.0, count: 9, spacing: 2.2, isRiskRoute: true, archetype: 'RISK_REWARD' },
      { type: 'JETPACK', lane: 1, zOffset: 46.0, isRiskRoute: true }
    ]
  },

  // 4. High Barrier Slide + Low Barrier Jump
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
      { type: 'COIN', lane: 0, zOffset: 16.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 0, zOffset: 26.0, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: 0, zOffset: 49.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 56.5, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: -1, zOffset: 22.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'MAGNET', lane: -1, zOffset: 36.0 }
    ]
  },

  // 5. Side Barrier Squeeze Intro (Construction Barricade in Lane -1)
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
      { type: 'COIN', lane: -1, endLane: 0, zOffset: 14.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 26.0, count: 9, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, zOffset: 34.0, count: 5, spacing: 2.0, isPostObstacle: true, archetype: 'POST_OBSTACLE' }
    ]
  },

  // 6. Flanked Hurdles with Open Center Lane
  {
    name: 'FLANKED_HURDLES',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP', 'LANE_CHANGE'],
    safeRoutes: 'Center lane allows clear run-through, or jump low hurdles in left/right',
    minReactionDist: 32.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: -1, zOffset: 22.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 22.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 14.0, count: 7, spacing: 2.2, isRiskRoute: false, archetype: 'RISK_REWARD' },
      { type: 'COIN', lane: 1, zOffset: 19.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, isRiskRoute: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 1, zOffset: 26.5, count: 4, spacing: 1.8, isPostObstacle: true, isRiskRoute: true, archetype: 'POST_OBSTACLE' },
      { type: 'SNEAKERS', lane: 1, zOffset: 38.0, isRiskRoute: true }
    ]
  },

  // 7. Gentle Weave Intro (Alternating Hurdles & High Barrier)
  {
    name: 'GENTLE_WEAVE_INTRO',
    difficulty: 'BEGINNER',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['LANE_CHANGE', 'JUMP'],
    safeRoutes: 'Weave center-to-left around hurdle, or jump center',
    minReactionDist: 30.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: -1, zOffset: 20.0 },
      { type: 'HIGH_BARRIER', lane: 1, zOffset: 40.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, endLane: -1, zOffset: 10.0, count: 4, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: -1, zOffset: 17.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: -1, endLane: 0, zOffset: 24.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 1, zOffset: 36.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'SHIELD', lane: 0, zOffset: 44.0 }
    ]
  },

  // 8. Coin Valley Breather (Pacing recovery section with rich coin lines)
  {
    name: 'COIN_VALLEY_BREATHER',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Generous recovery stretch with triple coin arches and single side hurdle',
    minReactionDist: 35.0,
    isBreather: true,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 1, zOffset: 58.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 8.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: -1, zOffset: 16.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, endLane: 0, zOffset: 36.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 48.0, count: 6, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'MAGNET', lane: 0, zOffset: 62.0 }
    ]
  },

  // =========================================================================
  // 2. INTERMEDIATE / MEDIUM PATTERNS (250 - 750m, Speed: 24 - 29 m/s)
  // Multi-lane decisions, train roofs, oncoming trains, tunnel arches
  // =========================================================================

  // 9. Train with Ramp onto Roof!
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
      { type: 'COIN', lane: 0, zOffset: 19.0, yOffset: 5.20, count: 4, spacing: 2.0, isRampAscent: true, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: 0, zOffset: 27.5, yOffset: 5.20, count: 8, spacing: 2.2, archetype: 'TRAIN_ROOFTOP' },
      { type: 'SNEAKERS', lane: 0, zOffset: 38.0, yOffset: 5.20 },
      { type: 'COIN', lane: 1, zOffset: 18.0, count: 7, spacing: 2.4, isRiskRoute: false, archetype: 'RISK_REWARD' }
    ]
  },

  // 10. Dual Trains with Center Escape Lane
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
      { type: 'COIN', lane: 0, zOffset: 16.0, count: 6, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 29.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 36.5, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'MULTIPLIER', lane: 0, zOffset: 52.0 }
    ]
  },

  // 11. Zig-Zag Weave (Left Train, then Right Train)
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
      { type: 'COIN', lane: 1, zOffset: 16.0, count: 6, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, endLane: 0, zOffset: 30.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 16.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: -1, zOffset: 44.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'HOVERBOARD', lane: 0, zOffset: 44.0 }
    ]
  },

  // 12. Telegraphed Oncoming Moving Train
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
      { type: 'COIN', lane: 1, endLane: 0, zOffset: 12.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 24.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, zOffset: 25.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'SHIELD', lane: 0, zOffset: 44.0 }
    ]
  },

  // 13. Tunnel Archway Clearance Slide
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
      { type: 'COIN', lane: 0, zOffset: 20.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 0, zOffset: 30.0, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: 0, zOffset: 49.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: -1, zOffset: 18.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'MAGNET', lane: -1, zOffset: 42.0 }
    ]
  },

  // 14. Double Hurdle Rhythm (Jump center, shift, jump side)
  {
    name: 'DOUBLE_HURDLE_RHYTHM',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP', 'LANE_CHANGE'],
    safeRoutes: 'Jump low barrier at z=20m in center, then lane 1 hurdle at z=48m; lane -1 clear',
    minReactionDist: 26.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 0, zOffset: 20.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 48.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 17.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 24.5, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: 0, endLane: 1, zOffset: 34.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 1, zOffset: 45.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: -1, zOffset: 20.0, count: 9, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 15. Side Barrier Chicane (S-curve lane transitions)
  {
    name: 'SIDE_BARRIER_CHICANE',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Avoid right side barrier at z=22m, then avoid left side barrier at z=48m',
    minReactionDist: 27.0,
    obstacles: [
      { type: 'SIDE_BARRIER', lane: 1, zOffset: 22.0 },
      { type: 'SIDE_BARRIER', lane: -1, zOffset: 48.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, endLane: 0, zOffset: 12.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 24.0, count: 6, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, endLane: 1, zOffset: 38.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 1, zOffset: 50.0, count: 6, spacing: 2.0, isPostObstacle: true, archetype: 'POST_OBSTACLE' }
    ]
  },

  // 16. Mid-Run Breather (Pacing relief during intermediate tempo)
  {
    name: 'MID_RUN_BREATHER',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Generous recovery with coin corridors across all 3 lanes and single hurdle in left',
    minReactionDist: 30.0,
    isBreather: true,
    obstacles: [
      { type: 'LOW_BARRIER', lane: -1, zOffset: 54.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 14.0, count: 10, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, zOffset: 22.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, zOffset: 51.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'SHIELD', lane: 0, zOffset: 46.0 }
    ]
  },

  // =========================================================================
  // 3. ADVANCED / HARD PATTERNS (750 - 1600m, Speed: 29 - 34 m/s)
  // Higher decision density, rapid slide-to-jump, moving trains, paired hazards
  // =========================================================================

  // 17. Triple Track Rhythm Challenge
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
      { type: 'COIN', lane: -1, zOffset: 19.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 1, zOffset: 18.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 1, endLane: 0, zOffset: 34.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 46.0, count: 7, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'SHIELD', lane: 0, zOffset: 62.0 }
    ]
  },

  // 18. Overhead Tunnel Gantry Run
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
      { type: 'COIN', lane: -1, zOffset: 16.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 0, zOffset: 26.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 0, zOffset: 47.0, yOffset: 5.20, count: 4, spacing: 2.0, isRampAscent: true, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: 0, zOffset: 55.5, yOffset: 5.20, count: 6, spacing: 2.2, archetype: 'TRAIN_ROOFTOP' },
      { type: 'MAGNET', lane: 0, zOffset: 58.0, yOffset: 5.20 }
    ]
  },

  // 19. Moving Train Intercept & Side Barricade
  {
    name: 'MOVING_TRAIN_INTERCEPT',
    difficulty: 'ADVANCED',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Center moving train rushes forward; side barrier in lane -1 at z=42m; lane 1 clear or jump in -1 early',
    minReactionDist: 28.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 0, zOffset: 48.0, length: 24.0, isMoving: true, velocityZ: CONSTANTS.MOVING_TRAIN_SPEED },
      { type: 'SIDE_BARRIER', lane: -1, zOffset: 42.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 20.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, zOffset: 17.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 1, zOffset: 24.5, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: 1, zOffset: 34.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'HOVERBOARD', lane: 1, zOffset: 56.0 }
    ]
  },

  // 20. Paired Hazards Squeeze
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
      { type: 'COIN', lane: 0, zOffset: 18.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 0, endLane: 1, zOffset: 28.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 1, zOffset: 33.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 1, zOffset: 41.5, count: 5, spacing: 2.0, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'MULTIPLIER', lane: 1, zOffset: 58.0 }
    ]
  },

  // 21. Alternating Obstacles Tempo
  {
    name: 'ALTERNATING_TEMPO',
    difficulty: 'ADVANCED',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP', 'SLIDE', 'LANE_CHANGE'],
    safeRoutes: 'Staggered obstacles: jump at z=18m, slide at z=32m, weave right at z=48m',
    minReactionDist: 22.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: -1, zOffset: 18.0 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 32.0 },
      { type: 'SIDE_BARRIER', lane: 1, zOffset: 48.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 56.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 15.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 28.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 1, endLane: 0, zOffset: 36.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 53.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' }
    ]
  },

  // 22. Rooftop to Rooftop Gap Navigation
  {
    name: 'ROOFTOP_TO_ROOFTOP_GAP',
    difficulty: 'HARD',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['JUMP', 'LANE_CHANGE'],
    safeRoutes: 'Climb ramp on train in lane -1, or stay in lane 1 to avoid center train',
    minReactionDist: 24.0,
    obstacles: [
      { type: 'TRAIN', lane: -1, zOffset: 16.0, length: 24.0, hasRamp: true },
      { type: 'TRAIN', lane: 0, zOffset: 46.0, length: 24.0, hasRamp: true },
      { type: 'HIGH_BARRIER', lane: 1, zOffset: 26.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 15.0, yOffset: 5.20, count: 4, spacing: 2.0, isRampAscent: true, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: -1, zOffset: 23.5, yOffset: 5.20, count: 6, spacing: 2.2, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: 0, zOffset: 45.0, yOffset: 5.20, count: 4, spacing: 2.0, isRampAscent: true, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: 0, zOffset: 53.5, yOffset: 5.20, count: 6, spacing: 2.2, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: 1, zOffset: 22.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'SNEAKERS', lane: 0, zOffset: 54.0, yOffset: 5.20 }
    ]
  },

  // =========================================================================
  // 4. EXPERT PATTERNS (1600m+, Speed: 34 - 38 m/s)
  // Tight, skill-testing, fair multi-step solutions, rewarding mastery
  // =========================================================================

  // 23. Expert Gauntlet: Dive, Weave and Vault
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
      { type: 'COIN', lane: -1, zOffset: 14.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: -1, endLane: 0, zOffset: 26.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 39.0, yOffset: 5.20, count: 4, spacing: 2.0, isRampAscent: true, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: 0, zOffset: 47.5, yOffset: 5.20, count: 6, spacing: 2.2, archetype: 'TRAIN_ROOFTOP' },
      { type: 'JETPACK', lane: 0, zOffset: 58.0, yOffset: 5.20 }
    ]
  },

  // 24. Expert Double Moving Train Reflex
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
      { type: 'COIN', lane: 1, endLane: 0, zOffset: 12.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 21.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 28.5, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: -1, zOffset: 41.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'SHIELD', lane: -1, zOffset: 54.0 }
    ]
  },

  // 25. Expert Tunnel & Train Squeeze
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
      { type: 'COIN', lane: -1, zOffset: 16.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 1, zOffset: 16.0, count: 8, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, zOffset: 26.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, zOffset: 49.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'HOVERBOARD', lane: -1, zOffset: 60.0 }
    ]
  },

  // 26. Precision High-Risk Coin Path (Tempting Skill Route)
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
      // Safe Route (Left Lane): open, no hazards, baseline 6 coins
      { type: 'COIN', lane: -1, zOffset: 16.0, count: 6, spacing: 2.4, isRiskRoute: false, archetype: 'RISK_REWARD' },
      // Risk Route (Center Lane): low hurdle jump arc + slide guidance under high barrier + reward burst = 13 coins + 2X Multiplier
      { type: 'COIN', lane: 0, zOffset: 15.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, isRiskRoute: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 34.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, isRiskRoute: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 0, zOffset: 44.0, count: 4, spacing: 1.8, isPostObstacle: true, isRiskRoute: true, archetype: 'POST_OBSTACLE' },
      { type: 'MULTIPLIER', lane: 0, zOffset: 52.0, isRiskRoute: true }
    ]
  },

  // 27. Expert Triple Lane Gauntlet
  {
    name: 'EXPERT_TRIPLE_LANE_GAUNTLET',
    difficulty: 'EXPERT',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['LANE_CHANGE', 'SLIDE', 'JUMP'],
    safeRoutes: 'Side barrier in lane -1 at z=18m, jump center hurdle at z=24m, then slide under high barrier in lane 1 at z=50m',
    minReactionDist: 20.0,
    obstacles: [
      { type: 'SIDE_BARRIER', lane: -1, zOffset: 18.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 24.0 },
      { type: 'TRAIN', lane: -1, zOffset: 42.0, length: 24.0 },
      { type: 'HIGH_BARRIER', lane: 1, zOffset: 50.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, endLane: 0, zOffset: 10.0, count: 4, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 21.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 28.5, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' },
      { type: 'COIN', lane: 1, zOffset: 46.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'SHIELD', lane: 0, zOffset: 56.0 }
    ]
  },

  // =========================================================================
  // TASK 2 PATTERNS: MOVING TRAINS, PILLARS, MODULAR TUNNELS, 3 BARRIERS
  // =========================================================================

  // 28. Moving Train with Free Side Lanes (Easy Oncoming Encounter)
  {
    name: 'MOVING_TRAIN_SIDE_CHOICE',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Oncoming moving train in center lane; shift to lane -1 or lane 1 before z=45m',
    minReactionDist: 32.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 0, zOffset: 45.0, length: 20.0, isMoving: true, velocityZ: CONSTANTS.MOVING_TRAIN_SPEED }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, endLane: -1, zOffset: 14.0, count: 6, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: -1, zOffset: 30.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, zOffset: 26.0, count: 9, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 29. Low Hurdle Followed by High Barrier (Rhythmic Jump-Then-Slide)
  {
    name: 'LOW_HURDLE_TO_HIGH_BARRIER',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP', 'SLIDE'],
    safeRoutes: 'Jump low hurdle in center lane at z=24m, then slide under high barrier at z=52m, or take open flanks',
    minReactionDist: 24.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 0, zOffset: 24.0 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 52.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 21.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 48.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: -1, zOffset: 20.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 30. Central Structural Railway Pillar with Free Side Routes
  {
    name: 'PILLAR_CENTRAL_SPLIT',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Heavy structural bridge pillar in center lane at z=36m; dodge left to lane -1 or right to lane 1',
    minReactionDist: 34.0,
    obstacles: [
      { type: 'PILLAR', lane: 0, zOffset: 36.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, endLane: 1, zOffset: 14.0, count: 6, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 1, zOffset: 30.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, zOffset: 26.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 31. Slide Gantry Followed by Stationary Train
  {
    name: 'SLIDE_GANTRY_TO_TRAIN',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['SLIDE', 'LANE_CHANGE'],
    safeRoutes: 'Slide under high barrier in lane -1 at z=22m, or jump low hurdle in lane 1 at z=26m; center lane blocked by train at z=35m',
    minReactionDist: 22.0,
    obstacles: [
      { type: 'HIGH_BARRIER', lane: -1, zOffset: 22.0 },
      { type: 'TRAIN', lane: 0, zOffset: 35.0, length: 24.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 26.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 18.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 1, zOffset: 23.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 1, zOffset: 32.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 32. Pillar and Side-Lane Hurdles
  {
    name: 'PILLAR_AND_LOW_BARRIER',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['JUMP', 'LANE_CHANGE'],
    safeRoutes: 'Pillar in lane -1 at z=30m; jump low hurdle in center lane at z=30m, or peak jump medium barrier in lane 1 at z=56m',
    minReactionDist: 25.0,
    obstacles: [
      { type: 'PILLAR', lane: -1, zOffset: 30.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 30.0 },
      { type: 'MEDIUM_BARRIER', lane: 1, zOffset: 56.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 27.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 1, zOffset: 20.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 38.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 33. Tunnel Entry Portal Followed by Overhead Slide Hazard
  {
    name: 'TUNNEL_ENTRY_SLIDE_HAZARD',
    difficulty: 'MEDIUM',
    isTunnel: true,
    tunnelPortal: 'ENTRY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0],
    requiredActions: ['SLIDE'],
    safeRoutes: 'Enter subway tunnel portal; slide under overhead clearance gantry in center lane at z=28m, or take open left lane',
    minReactionDist: 25.0,
    obstacles: [
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 28.0 },
      { type: 'PILLAR', lane: 1, zOffset: 46.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 24.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: -1, zOffset: 20.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 36.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 34. Enclosed Short Subway Tunnel Section with Varied Internal Obstacles
  {
    name: 'TUNNEL_SHORT_ENCLOSED',
    difficulty: 'MEDIUM',
    isTunnel: true,
    tunnelPortal: 'BOTH',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['LANE_CHANGE', 'SLIDE'],
    safeRoutes: 'Complete short tunnel; avoid center support pillar at z=26m, slide under lane 1 high barrier at z=50m, or take lane -1',
    minReactionDist: 24.0,
    obstacles: [
      { type: 'PILLAR', lane: 0, zOffset: 26.0 },
      { type: 'HIGH_BARRIER', lane: 1, zOffset: 50.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, endLane: -1, zOffset: 12.0, count: 5, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: -1, zOffset: 26.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, zOffset: 46.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' }
    ]
  },

  // 35. Tunnel Exit Portal Followed by Oncoming Moving Train
  {
    name: 'TUNNEL_EXIT_MOVING_TRAIN',
    difficulty: 'HARD',
    isTunnel: true,
    tunnelPortal: 'EXIT',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['LANE_CHANGE', 'JUMP'],
    safeRoutes: 'Exit tunnel portal into oncoming moving train in center lane; shift to lane -1 and jump low barrier at z=22m',
    minReactionDist: 22.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: -1, zOffset: 22.0 },
      { type: 'PILLAR', lane: 1, zOffset: 24.0 },
      { type: 'MOVING_TRAIN', lane: 0, zOffset: 48.0, length: 22.0, isMoving: true, velocityZ: CONSTANTS.MOVING_TRAIN_SPEED }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 19.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: -1, zOffset: 32.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 0, endLane: -1, zOffset: 10.0, count: 4, spacing: 2.0, archetype: 'LANE_SWITCH' }
    ]
  },

  // 36. Ramp and Rooftop High-Speed Traverse
  {
    name: 'RAMP_AND_ROOFTOP_RUN',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Climb train ramp in lane -1 at z=18m to run along roof at y=5.2m; ground level center lane blocked by train at z=46m',
    minReactionDist: 26.0,
    obstacles: [
      { type: 'TRAIN_RAMP', lane: -1, zOffset: 18.0, length: 22.0, hasRamp: true },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 24.0 },
      { type: 'TRAIN', lane: 0, zOffset: 46.0, length: 20.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 18.0, count: 8, spacing: 2.4, yOffset: 5.20, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: 1, zOffset: 22.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 37. Consecutive Jump and Slide Gauntlet
  {
    name: 'CONSECUTIVE_JUMP_SLIDE_GAUNTLET',
    difficulty: 'HARD',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0],
    requiredActions: ['JUMP', 'SLIDE'],
    safeRoutes: 'Jump low hurdle at z=20m, slide under high barrier at z=44m, peak jump medium barrier at z=66m in center lane',
    minReactionDist: 20.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 0, zOffset: 20.0 },
      { type: 'TRAIN', lane: 1, zOffset: 24.0, length: 26.0 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 44.0 },
      { type: 'MEDIUM_BARRIER', lane: 0, zOffset: 66.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 17.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 40.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: -1, zOffset: 20.0, count: 8, spacing: 2.4, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 38. Expert Moving Train and Structural Pillar Gauntlet
  {
    name: 'EXPERT_MOVING_TRAIN_PILLAR_MAZE',
    difficulty: 'EXPERT',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0],
    requiredActions: ['LANE_CHANGE', 'SLIDE'],
    safeRoutes: 'Avoid central pillar at z=24m by shifting to lane -1, then slide under high barrier at z=52m while oncoming train roars past in lane 1',
    minReactionDist: 20.0,
    obstacles: [
      { type: 'PILLAR', lane: 0, zOffset: 24.0 },
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 46.0, length: 22.0, isMoving: true, velocityZ: CONSTANTS.MOVING_TRAIN_SPEED },
      { type: 'HIGH_BARRIER', lane: -1, zOffset: 52.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, endLane: -1, zOffset: 10.0, count: 5, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: -1, zOffset: 48.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: -1, zOffset: 58.0, count: 4, spacing: 1.8, isPostObstacle: true, archetype: 'POST_OBSTACLE' }
    ]
  },

  // 39. Guaranteed Safe Recovery Connector (Universal fallback & breathing section)
  {
    name: 'SAFE_RECOVERY_CONNECTOR',
    difficulty: 'EASY',
    isBreather: true,
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: [],
    safeRoutes: 'Guaranteed universal recovery corridor; first 50m has zero obstacles across all 3 lanes, followed by light warning hurdle in lane 1 at z=56m',
    minReactionDist: 50.0,
    obstacles: [
      { type: 'LOW_BARRIER', lane: 1, zOffset: 56.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 8.0, count: 12, spacing: 2.4, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, zOffset: 20.0, count: 8, spacing: 2.4, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, zOffset: 12.0, count: 6, spacing: 2.4, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: 1, zOffset: 53.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' }
    ]
  },

  // 40. Beginner Rooftop Cruise (37m 2-carriage commuter consist)
  {
    name: 'BEGINNER_ROOFTOP_CRUISE',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Climb 8m visible ramp onto commuter twin-set, collect rooftop gold, descend safely via rear ramp',
    minReactionDist: 35.0,
    obstacles: [
      {
        type: 'TRAIN_COMPOSITION',
        lane: 0,
        zOffset: 12.0,
        length: 37.2,
        hasRamp: true,
        hasExitRamp: true,
        composition: COMMUTER_TWIN_SET,
        carriageGroupId: 'commuter_twin_0'
      },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 24.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 36.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 4.0, count: 5, spacing: 1.6, archetype: 'RAMP_ASCENT' },
      { type: 'COIN', lane: 0, zOffset: 14.0, yOffset: 5.20, count: 8, spacing: 2.2, archetype: 'ROOFTOP_RUN' },
      { type: 'COIN', lane: 0, zOffset: 34.0, count: 4, spacing: 1.8, archetype: 'DESCENT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 44.0, count: 5, spacing: 2.0, archetype: 'POST_ROOFTOP_REWARD' }
    ]
  },

  // 41. Intermediate Multi-Carriage Expedition (52m 3-carriage consist with AC hurdle)
  {
    name: 'INTERMEDIATE_MULTI_CARRIAGE_EXPEDITION',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Ascend center ramp onto 52m 3-carriage metro consist, jump over rooftop AC unit, ride rear exit ramp down',
    minReactionDist: 28.0,
    obstacles: [
      {
        type: 'TRAIN_COMPOSITION',
        lane: 0,
        zOffset: 10.0,
        length: 52.4,
        hasRamp: true,
        hasExitRamp: true,
        composition: METRO_TRIPLE_CONSIST,
        carriageGroupId: 'metro_triple_0'
      },
      { type: 'SIDE_BARRIER', lane: -1, zOffset: 28.0 },
      { type: 'SIDE_BARRIER', lane: 1, zOffset: 42.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 2.0, count: 5, spacing: 1.6, archetype: 'RAMP_ASCENT' },
      { type: 'COIN', lane: 0, zOffset: 12.0, yOffset: 5.20, count: 7, spacing: 2.2, archetype: 'ROOFTOP_RUN' },
      { type: 'COIN', lane: 0, zOffset: 30.0, yOffset: 6.20, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 40.0, yOffset: 5.20, count: 5, spacing: 2.2, archetype: 'ROOFTOP_RUN' },
      { type: 'COIN', lane: 0, zOffset: 54.0, count: 4, spacing: 1.8, archetype: 'DESCENT_TRAIL' },
      { type: 'COIN', lane: 0, zOffset: 64.0, count: 5, spacing: 2.0, archetype: 'POST_ROOFTOP_REWARD' }
    ]
  },

  // 42. Express Quad Rooftop Challenge (70m 4-carriage consist with rooftop obstacles)
  {
    name: 'EXPRESS_QUAD_ROOFTOP_CHALLENGE',
    difficulty: 'HARD',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP', 'LANE_CHANGE'],
    safeRoutes: 'Climb 4-carriage express train on right, leap over rooftop hurdles, step down safe exit ramp',
    minReactionDist: 24.0,
    obstacles: [
      {
        type: 'TRAIN_COMPOSITION',
        lane: 1,
        zOffset: 6.0,
        length: 69.6,
        hasRamp: true,
        hasExitRamp: true,
        composition: EXPRESS_QUAD_CONSIST,
        carriageGroupId: 'express_quad_1'
      },
      { type: 'TRAIN', lane: -1, zOffset: 22.0, length: 28.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 38.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, zOffset: 0.0, count: 5, spacing: 1.6, archetype: 'RAMP_ASCENT' },
      { type: 'COIN', lane: 1, zOffset: 10.0, yOffset: 5.20, count: 8, spacing: 2.0, archetype: 'ROOFTOP_RUN' },
      { type: 'COIN', lane: 1, zOffset: 30.0, yOffset: 6.20, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 1, zOffset: 48.0, yOffset: 6.20, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 1, zOffset: 62.0, count: 4, spacing: 1.8, archetype: 'DESCENT_TRAIL' },
      { type: 'SHIELD', lane: 1, zOffset: 72.0 }
    ]
  },

  // 43. Advanced Carriage Gap Hop (Leap across 3.5m gap between uncoupled trains)
  {
    name: 'ADVANCED_CARRIAGE_GAP_HOP',
    difficulty: 'HARD',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0, 1],
    requiredActions: ['JUMP'],
    safeRoutes: 'Ascend train on lane -1, leap across 3.5m carriage gap to rear train roof, dismount safely onto clear ground',
    minReactionDist: 22.0,
    obstacles: [
      {
        type: 'TRAIN',
        lane: -1,
        zOffset: 8.0,
        length: 26.0,
        hasRamp: true,
        carriageGroupId: 'gap_hop_lead'
      },
      {
        type: 'TRAIN',
        lane: -1,
        zOffset: 37.5,
        length: 26.0,
        hasRamp: false,
        carriageGroupId: 'gap_hop_trail'
      },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 20.0 },
      { type: 'MEDIUM_BARRIER', lane: 1, zOffset: 34.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 0.0, count: 5, spacing: 1.6, archetype: 'RAMP_ASCENT' },
      { type: 'COIN', lane: -1, zOffset: 10.0, yOffset: 5.20, count: 6, spacing: 2.0, archetype: 'ROOFTOP_RUN' },
      { type: 'COIN', lane: -1, zOffset: 28.0, yOffset: 6.30, count: 5, spacing: 1.8, isArc: true, archetype: 'CARRIAGE_GAP_JUMP' },
      { type: 'COIN', lane: -1, zOffset: 42.0, yOffset: 5.20, count: 6, spacing: 2.0, archetype: 'ROOFTOP_RUN' },
      { type: 'COIN', lane: -1, zOffset: 66.0, count: 4, spacing: 2.0, archetype: 'POST_ROOFTOP_REWARD' }
    ]
  },

  // =========================================================================
  // TASK 4 PATTERNS: DYNAMIC MOVING TRAINS & PROGRESSIVE RAILWAY TRAFFIC
  // =========================================================================

  // 44. Moving Train with Open Left Bypass (Easy Early Encounter)
  {
    name: 'MOVING_TRAIN_LEFT_BYPASS',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['LANE_CHANGE', 'JUMP'],
    safeRoutes: 'Oncoming moving train in Left lane (-1); shift right into Center or Right lane; low hurdle in center at z=24m',
    minReactionDist: 34.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: -1, zOffset: 48.0, length: 22.0, isMoving: true },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 24.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, endLane: 0, zOffset: 12.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 21.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 1, zOffset: 22.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 45. Moving Train Right Approach (Easy Clear Center Runway)
  {
    name: 'MOVING_TRAIN_RIGHT_APPROACH',
    difficulty: 'EASY',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Oncoming moving train in Right lane (1); Center lane provides wide-open clear passage with coin line',
    minReactionDist: 32.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 46.0, length: 20.0, isMoving: true },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 56.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, endLane: 0, zOffset: 14.0, count: 5, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 26.0, count: 9, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' },
      { type: 'COIN', lane: -1, zOffset: 24.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 46. Moving Train Center with Stationary Flank (Medium Traffic Arrangement)
  {
    name: 'MOVING_TRAIN_CENTER_STATIONARY_FLANK',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [1],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Stationary train blocks Left lane (-1) at z=18m, oncoming train rushes Center lane (0) at z=48m; Right lane (1) is the safe express channel',
    minReactionDist: 28.0,
    obstacles: [
      { type: 'TRAIN', lane: -1, zOffset: 18.0, length: 22.0 },
      { type: 'MOVING_TRAIN', lane: 0, zOffset: 48.0, length: 22.0, isMoving: true }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, endLane: 1, zOffset: 12.0, count: 6, spacing: 2.2, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 1, zOffset: 26.0, count: 10, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 47. Moving Train Right with Slide Option (Medium Agile Evasion)
  {
    name: 'MOVING_TRAIN_RIGHT_SLIDE_ESCAPE',
    difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0],
    requiredActions: ['LANE_CHANGE', 'SLIDE'],
    safeRoutes: 'Oncoming train in Right lane (1); slide under high barrier in Left lane (-1) at z=28m, or run through clear Center lane',
    minReactionDist: 26.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 46.0, length: 22.0, isMoving: true },
      { type: 'HIGH_BARRIER', lane: -1, zOffset: 28.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 24.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 0, zOffset: 22.0, count: 8, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 48. Staggered Dual Moving Trains (Hard Multi-Train Safe Channel)
  {
    name: 'MOVING_TRAIN_STAGGERED_DOUBLE',
    difficulty: 'HARD',
    entryLanes: [-1, 0, 1],
    exitLanes: [0],
    requiredActions: ['LANE_CHANGE'],
    safeRoutes: 'Staggered oncoming trains in Right lane (z=32m) and Left lane (z=58m); Center lane 0 remains open throughout as a high-speed express route',
    minReactionDist: 26.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 40.0, length: 20.0, isMoving: true },
      { type: 'MOVING_TRAIN', lane: -1, zOffset: 64.0, length: 20.0, isMoving: true }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, endLane: 0, zOffset: 12.0, count: 5, spacing: 2.0, archetype: 'LANE_SWITCH' },
      { type: 'COIN', lane: 0, zOffset: 24.0, count: 12, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 49. Climbable Ramp Train with Flanking Moving Train (Hard Dynamic Rooftop Opportunity)
  {
    name: 'STATIONARY_RAMP_WITH_ONCOMING_TRAIN',
    difficulty: 'HARD',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 0],
    requiredActions: ['JUMP', 'LANE_CHANGE'],
    safeRoutes: 'Climb ramp in Center lane (0) at z=14m to ride safely on roof at Y=4.35m while oncoming train roars past on Right lane (1); or bypass via Left lane',
    minReactionDist: 25.0,
    obstacles: [
      { type: 'TRAIN_RAMP', lane: 0, zOffset: 14.0, length: 26.0, hasRamp: true },
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 48.0, length: 22.0, isMoving: true },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 34.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 14.0, yOffset: 5.20, count: 8, spacing: 2.2, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: -1, zOffset: 31.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' }
    ]
  },

  // 50. Expert Moving Train Express Weave (Expert Rapid Decisions)
  {
    name: 'EXPERT_MOVING_TRAIN_EXPRESS_WEAVE',
    difficulty: 'EXPERT',
    entryLanes: [-1, 0, 1],
    exitLanes: [-1, 1],
    requiredActions: ['LANE_CHANGE', 'SLIDE', 'JUMP'],
    safeRoutes: 'Center moving train rushes down; slide under high barrier in Right lane (z=24m), or jump low hurdle in Left lane (z=30m)',
    minReactionDist: 22.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 0, zOffset: 48.0, length: 24.0, isMoving: true },
      { type: 'HIGH_BARRIER', lane: 1, zOffset: 24.0 },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 30.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, zOffset: 20.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: -1, zOffset: 27.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' }
    ]
  },

  // 51. Expert Rapid Traffic Corridor (Expert Clustered Challenge)
  {
    name: 'EXPERT_RAPID_TRAFFIC_CORRIDOR',
    difficulty: 'EXPERT',
    entryLanes: [-1, 0, 1],
    exitLanes: [0],
    requiredActions: ['LANE_CHANGE', 'JUMP'],
    safeRoutes: 'Moving train on Left lane (-1) and stationary train on Right lane (1); Center lane has low hurdle at z=22m leading into clear sprint',
    minReactionDist: 20.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: -1, zOffset: 46.0, length: 22.0, isMoving: true },
      { type: 'TRAIN', lane: 1, zOffset: 36.0, length: 24.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 22.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 19.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 32.0, count: 6, spacing: 2.2, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 52. Hard Jump-Slide Express Gauntlet (Precision Jump to Slide with Train)
  {
    name: 'HARD_JUMP_SLIDE_EXPRESS',
    difficulty: 'HARD',
    entryLanes: [-1, 0, 1],
    exitLanes: [0, 1],
    requiredActions: ['LANE_CHANGE', 'JUMP', 'SLIDE'],
    safeRoutes: 'Moving train rushes Left lane (-1); Center lane: Jump low hurdle at z=12m, slide under high barrier at z=48m; Right lane is alternate sprint path',
    minReactionDist: 22.0,
    obstacles: [
      { type: 'MOVING_TRAIN', lane: -1, zOffset: 52.0, length: 22.0, isMoving: true },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 12.0 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 48.0 },
      { type: 'PILLAR', lane: 1, zOffset: 28.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 9.3, yOffset: 2.35, count: 4, spacing: 1.8, isArc: true, archetype: 'JUMP_ARC' },
      { type: 'COIN', lane: 0, zOffset: 44.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 1, zOffset: 34.0, count: 6, spacing: 2.0, archetype: 'STRAIGHT_TRAIL' }
    ]
  },

  // 53. Hard Slide-Switch Roof Run (Slide into Lane Switch onto Train Rooftop)
  {
    name: 'HARD_SLIDE_SWITCH_ROOF_RUN',
    difficulty: 'EXPERT',
    entryLanes: [-1, 0, 1],
    exitLanes: [0],
    requiredActions: ['SLIDE', 'LANE_CHANGE'],
    safeRoutes: 'Slide under high barrier in Left lane (-1) at z=16m, switch to Center lane (0) to mount ramp train at z=32m and run along roof; Right lane has oncoming moving train',
    minReactionDist: 22.0,
    obstacles: [
      { type: 'HIGH_BARRIER', lane: -1, zOffset: 16.0 },
      { type: 'TRAIN', lane: 0, zOffset: 32.0, length: 26.0, hasRamp: true },
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 48.0, length: 22.0, isMoving: true }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 12.4, yOffset: 0.60, count: 5, spacing: 1.8, isSlideGuidance: true, archetype: 'SLIDE_GUIDANCE' },
      { type: 'COIN', lane: 0, zOffset: 42.0, yOffset: 5.20, count: 6, spacing: 2.0, archetype: 'ROOFTOP_RUN' }
    ]
  },
  // Readable early roof access also fits the reserved moving-traffic corridors.
  {
    name: 'RAILWAY_EARLY_ROOF_LINK', difficulty: 'EASY',
    entryLanes: [-1, 0, 1], exitLanes: [-1, 0, 1], requiredActions: ['LANE_CHANGE'],
    minReactionDist: 32,
    safeRoutes: 'Climb the parked train ramp or use either open adjacent track.',
    obstacles: [{ type: 'TRAIN_RAMP', lane: 0, zOffset: 40, length: 26, hasRamp: true }],
    collectibles: [{ type: 'COIN', lane: 0, zOffset: 30, count: 7, spacing: 3, yOffset: 5.2, archetype: 'TRAIN_ROOFTOP' }]
  },
  {
    name: 'RAILWAY_EARLY_MIXED_APPROACH', difficulty: 'EASY',
    entryLanes: [-1, 0, 1], exitLanes: [-1, 0], requiredActions: ['LANE_CHANGE'],
    minReactionDist: 32,
    safeRoutes: 'Left track stays clear beside a ramp train and an approaching right-track express.',
    obstacles: [
      { type: 'TRAIN_RAMP', lane: 0, zOffset: 40, length: 26, hasRamp: true },
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 48, length: 20, isMoving: true }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 30, count: 7, spacing: 3, yOffset: 5.2, archetype: 'TRAIN_ROOFTOP' },
      { type: 'COIN', lane: -1, zOffset: 20, count: 9, spacing: 3, archetype: 'STRAIGHT_TRAIL' }
    ]
  },
  // Single-lane roof links leave the two scheduled traffic corridors clear.
  {
    name: 'RAILWAY_ROOF_LINK', difficulty: 'MEDIUM',
    entryLanes: [-1, 0, 1], exitLanes: [-1, 0, 1], requiredActions: ['LANE_CHANGE'],
    minReactionDist: 28,
    safeRoutes: 'Climb the entry ramp, traverse the train roof, or use a clear adjacent lane.',
    obstacles: [{ type: 'TRAIN_COMPOSITION', lane: 0, zOffset: 40, length: COMMUTER_TWIN_SET.totalLength,
      composition: { ...COMMUTER_TWIN_SET, hasExitRamp: true,
        carriages: COMMUTER_TWIN_SET.carriages.map((car, index) =>
          index === COMMUTER_TWIN_SET.carriages.length - 1 ? { ...car, hasExitRamp: true } : car) },
      hasRamp: true, hasExitRamp: true }],
    collectibles: [{ type: 'COIN', lane: 0, zOffset: 27, count: 7, spacing: 3.6, yOffset: 5.2, archetype: 'TRAIN_ROOFTOP' }]
  },
  {
    name: 'RAILWAY_LONG_ROOF_LINK', difficulty: 'HARD',
    entryLanes: [-1, 0, 1], exitLanes: [-1, 0, 1], requiredActions: ['LANE_CHANGE', 'JUMP'],
    minReactionDist: 28,
    safeRoutes: 'Use the longer three-carriage roof route and exit ramp, or evade through an adjacent lane.',
    obstacles: [{ type: 'TRAIN_COMPOSITION', lane: 0, zOffset: 40, length: METRO_TRIPLE_CONSIST.totalLength,
      composition: { ...METRO_TRIPLE_CONSIST, hasExitRamp: true,
        carriages: METRO_TRIPLE_CONSIST.carriages.map((car, index) =>
          ({ ...car, localOffsetZ: car.localOffsetZ - (index > 0 ? 1 : 0),
            hasExitRamp: index === METRO_TRIPLE_CONSIST.carriages.length - 1 })) },
      hasRamp: true, hasExitRamp: true }],
    collectibles: [{ type: 'COIN', lane: 0, zOffset: 20, count: 12, spacing: 3.8, yOffset: 5.2, archetype: 'TRAIN_ROOFTOP' }]
  },


];

// Recombine proven roof geometry with traffic; retain a completely open bypass.
for (const name of ['RAILWAY_ROOF_LINK', 'RAILWAY_LONG_ROOF_LINK']) {
  const roof = OBSTACLE_PATTERNS.find((pattern) => pattern.name === name)!;
  OBSTACLE_PATTERNS.push({ ...roof, name: `${name}_EXPRESS`,
    obstacles: [...roof.obstacles, { type: 'MOVING_TRAIN', lane: 1, zOffset: 52, length: 22, isMoving: true }],
    exitLanes: [-1, 0], safeRoutes: 'Climb the existing roof route or use the open left bypass beside approaching traffic.' });
}

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
