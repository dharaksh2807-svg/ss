import { CONSTANTS, LaneIndex } from '../core/Constants';
import { ObstacleType } from './ObstacleFactory';
import { PowerupType } from '../player/PowerupManager';

export interface PatternObstacle {
  type: ObstacleType;
  lane: LaneIndex;
  zOffset: number; // Z distance from chunk start (0 to 80m)
  length?: number;
  hasRamp?: boolean;
}

export interface PatternCollectible {
  type: 'COIN' | PowerupType;
  lane: LaneIndex;
  zOffset: number;
  yOffset?: number; // Ground level (1.0) or train roof (5.2)
  count?: number; // Row of coins
  spacing?: number;
}

export interface TrackPattern {
  name: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  obstacles: PatternObstacle[];
  collectibles: PatternCollectible[];
}

export const OBSTACLE_PATTERNS: TrackPattern[] = [
  // 1. Runway Intro (Safe lane teaching)
  {
    name: 'RUNWAY_INTRO',
    difficulty: 'EASY',
    obstacles: [
      { type: 'LOW_BARRIER', lane: 0, zOffset: 35.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 15.0, count: 6, spacing: 2.2 },
      { type: 'COIN', lane: 0, zOffset: 33.0, yOffset: 2.2, count: 3, spacing: 1.8 } // Arch over hurdle
    ]
  },

  // 2. Center Train with Open Flanks
  {
    name: 'CENTER_TRAIN_FLANKS',
    difficulty: 'EASY',
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 25.0, length: 22.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 20.0, count: 8, spacing: 2.5 },
      { type: 'COIN', lane: 1, zOffset: 20.0, count: 8, spacing: 2.5 }
    ]
  },

  // 3. High Barrier Slide + Low Barrier Jump
  {
    name: 'SLIDE_AND_JUMP_COMBO',
    difficulty: 'EASY',
    obstacles: [
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 20.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 52.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 16.0, yOffset: 0.6, count: 5, spacing: 2.0 },
      { type: 'COIN', lane: 0, zOffset: 48.0, yOffset: 2.4, count: 4, spacing: 1.8 },
      { type: 'MAGNET', lane: -1, zOffset: 35.0 }
    ]
  },

  // 4. Train with Ramp onto Roof!
  {
    name: 'TRAIN_ROOF_RAMP_RUN',
    difficulty: 'MEDIUM',
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 20.0, length: 26.0, hasRamp: true },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 35.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 45.0 }
    ],
    collectibles: [
      // Coins line the roof of the train!
      { type: 'COIN', lane: 0, zOffset: 24.0, yOffset: 5.2, count: 10, spacing: 2.2 },
      { type: 'SNEAKERS', lane: 0, zOffset: 36.0, yOffset: 5.2 }
    ]
  },

  // 5. Dual Trains with Center Escape Lane
  {
    name: 'DUAL_TRAINS_CENTER_ESCAPE',
    difficulty: 'MEDIUM',
    obstacles: [
      { type: 'TRAIN', lane: -1, zOffset: 20.0, length: 24.0 },
      { type: 'TRAIN', lane: 1, zOffset: 20.0, length: 24.0 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 32.0 } // Jump down center lane between trains
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 18.0, count: 12, spacing: 2.2 },
      { type: 'MULTIPLIER', lane: 0, zOffset: 55.0 }
    ]
  },

  // 6. Zig-Zag Weave (Left Train, then Right Train)
  {
    name: 'ZIG_ZAG_WEAVE',
    difficulty: 'MEDIUM',
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

  // 7. Triple Track Rhythm Challenge
  {
    name: 'RHYTHM_CHALLENGE',
    difficulty: 'HARD',
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 15.0, length: 22.0 },
      { type: 'LOW_BARRIER', lane: -1, zOffset: 22.0 },
      { type: 'HIGH_BARRIER', lane: 1, zOffset: 22.0 },
      { type: 'TRAIN', lane: -1, zOffset: 46.0, length: 22.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 52.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 1, zOffset: 15.0, count: 8, spacing: 2.2 },
      { type: 'COIN', lane: 0, zOffset: 48.0, count: 8, spacing: 2.2 }
    ]
  },

  // 8. Overhead Tunnel Gantry Run
  {
    name: 'TUNNEL_GANTRY_RUN',
    difficulty: 'HARD',
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
  }
];

/**
 * Automated Feasibility Validator:
 * Validates that every obstacle pattern has at least one reachable, collision-free path.
 */
export function validatePatternFeasibility(
  pattern: TrackPattern,
  speed: number = CONSTANTS.INITIAL_SPEED
): { solvable: boolean; reason?: string } {
  // Check in 1-meter slices from z = 0 to z = CHUNK_LENGTH (80m)
  const zStep = 1.0;
  const chunkLen = CONSTANTS.CHUNK_LENGTH;

  // Track possible player states at each Z step: Set of { lane: LaneIndex, onRoof: boolean }
  interface State {
    lane: LaneIndex;
    onRoof: boolean;
  }

  let currentStates: State[] = [
    { lane: -1, onRoof: false },
    { lane: 0, onRoof: false },
    { lane: 1, onRoof: false }
  ];

  for (let z = 0; z < chunkLen; z += zStep) {
    const nextStates: State[] = [];

    for (const state of currentStates) {
      // Possible actions: stay in current lane, or transition to adjacent lane
      const possibleLanes: LaneIndex[] = [state.lane];
      if (state.lane > -1) possibleLanes.push((state.lane - 1) as LaneIndex);
      if (state.lane < 1) possibleLanes.push((state.lane + 1) as LaneIndex);

      for (const targetLane of possibleLanes) {
        // Check if targetLane at z has an unpassable fatal obstacle
        const fatalObstacle = pattern.obstacles.find((obs) => {
          if (obs.lane !== targetLane) return false;
          const obsStart = obs.zOffset;
          const obsEnd = obsStart + (obs.length || 2.0);

          if (z >= obsStart && z <= obsEnd) {
            // Train is fatal unless player is on roof or climbing ramp
            if (obs.type === 'TRAIN') {
              if (obs.hasRamp && z <= obsStart + CONSTANTS.TRAIN_RAMP_LENGTH) {
                return false; // Can climb up ramp!
              }
              if (state.onRoof) {
                return false; // Can safely run along train roof!
              }
              return true; // Fatal train wall
            }
          }
          return false;
        });

        if (!fatalObstacle) {
          const isTrain = pattern.obstacles.some(
            (o) => o.lane === targetLane && o.type === 'TRAIN' && z >= o.zOffset && z <= o.zOffset + (o.length || 2.0)
          );
          nextStates.push({
            lane: targetLane,
            onRoof: isTrain || state.onRoof
          });
        }
      }
    }

    // Deduplicate states
    const uniqueMap = new Map<string, State>();
    for (const s of nextStates) {
      uniqueMap.set(`${s.lane}_${s.onRoof}`, s);
    }
    currentStates = Array.from(uniqueMap.values());

    if (currentStates.length === 0) {
      return {
        solvable: false,
        reason: `Pattern "${pattern.name}" becomes completely blocked at z = ${z}m!`
      };
    }
  }

  return { solvable: true };
}
