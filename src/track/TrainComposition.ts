import { CONSTANTS, LaneIndex } from '../core/Constants';
import { TrainVariant } from './ObstacleFactory';

export type CarriageType =
  | 'LOCOMOTIVE_RAMP'
  | 'LOCOMOTIVE_CAB'
  | 'PASSENGER_COACH'
  | 'CARGO_CONTAINER'
  | 'CABOOSE_END'
  | 'LOCOMOTIVE_REAR_RAMP';

export interface CarriageComponent {
  id: string;
  type: CarriageType;
  length: number;
  localOffsetZ: number; // Center Z relative to train composition center
  variant?: TrainVariant;
  colorHex?: number;
  hasRamp?: boolean;
  hasExitRamp?: boolean;
}

export interface RooftopObstacleDef {
  id: string;
  type: 'ROOFTOP_AC_HURDLE' | 'ROOFTOP_VENT';
  localOffsetZ: number; // Distance from front of train roof
  height: number;
  length: number;
  width?: number;
}

export type TrainCompositionTier = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface TrainCompositionDef {
  id: string;
  name: string;
  tier: TrainCompositionTier;
  totalLength: number;
  carriages: CarriageComponent[];
  gangwayLength: number;
  hasRamp: boolean;
  hasExitRamp?: boolean;
  rampLength: number;
  rooftopObstacles: RooftopObstacleDef[];
  expectedDuration: {
    at18ms: number; // Duration in seconds at 18 m/s (initial speed)
    at28ms: number; // Duration in seconds at 28 m/s (mid speed)
    at38ms: number; // Duration in seconds at 38 m/s (max speed)
  };
  exitType: 'SAFE_DROP' | 'END_RAMP' | 'GAP_JUMP' | 'LANE_SWITCH';
}

/**
 * Calculates theoretical and kinematic time spent on a train roof and ramp
 */
export function calculateRooftopDuration(
  totalLength: number,
  arg2: number | boolean = CONSTANTS.INITIAL_SPEED,
  arg3: number | boolean = true,
  arg4: boolean = false
): number {
  let speed: number = CONSTANTS.INITIAL_SPEED;
  let hasRamp = true;
  let hasExitRamp = false;

  if (typeof arg2 === 'boolean') {
    hasRamp = arg2;
    if (typeof arg3 === 'number') speed = arg3;
    hasExitRamp = arg4;
  } else {
    speed = typeof arg2 === 'number' ? arg2 : CONSTANTS.INITIAL_SPEED;
    if (typeof arg3 === 'boolean') hasRamp = arg3;
    hasExitRamp = arg4;
  }

  const rampBonus = (hasRamp ? CONSTANTS.TRAIN_RAMP_LENGTH : 0) + (hasExitRamp ? CONSTANTS.TRAIN_RAMP_LENGTH : 0);
  const effectiveLength = totalLength + rampBonus;
  return Math.round((effectiveLength / Math.max(1.0, speed)) * 100) / 100;
}

/**
 * Translates target duration into required train length based on speed
 */
export function getRequiredTrainLength(
  targetDurationSeconds: number,
  speed: number = CONSTANTS.INITIAL_SPEED,
  hasRamp: boolean = true
): number {
  const rampLen = hasRamp ? CONSTANTS.TRAIN_RAMP_LENGTH : 0;
  return Math.max(16.0, targetDurationSeconds * speed - rampLen);
}

/**
 * Standard Modular Train Compositions
 */
export const TRAIN_COMPOSITIONS: Record<string, TrainCompositionDef> = {
  // 1. Beginner 2-Carriage Commuter Set (~2.0 - 2.5s roof time at 18 m/s)
  COMMUTER_TWIN_SET: {
    id: 'COMMUTER_TWIN_SET',
    name: 'Twin-Carriage Commuter Set',
    tier: 'BEGINNER',
    totalLength: 37.2, // 18m lead + 1.2m gangway + 18m rear coach
    gangwayLength: 1.2,
    hasRamp: true,
    hasExitRamp: false,
    rampLength: CONSTANTS.TRAIN_RAMP_LENGTH,
    carriages: [
      {
        id: 'car_0_lead_ramp',
        type: 'LOCOMOTIVE_RAMP',
        length: 18.0,
        localOffsetZ: 9.6,
        hasRamp: true
      },
      {
        id: 'car_1_rear_coach',
        type: 'PASSENGER_COACH',
        length: 18.0,
        localOffsetZ: -9.6,
        hasRamp: false
      }
    ],
    rooftopObstacles: [],
    expectedDuration: {
      at18ms: calculateRooftopDuration(37.2, true, 18.0), // ~2.51s
      at28ms: calculateRooftopDuration(37.2, true, 28.0), // ~1.61s
      at38ms: calculateRooftopDuration(37.2, true, 38.0)  // ~1.19s
    },
    exitType: 'SAFE_DROP'
  },

  // 2. Intermediate 3-Carriage Metro Consist (~3.0 - 4.0s roof time at 18 m/s)
  METRO_TRIPLE_CONSIST: {
    id: 'METRO_TRIPLE_CONSIST',
    name: 'Triple-Carriage Metro Consist',
    tier: 'INTERMEDIATE',
    totalLength: 52.4, // 18m + 1.2m + 16m + 1.2m + 16m
    gangwayLength: 1.2,
    hasRamp: true,
    hasExitRamp: false,
    rampLength: CONSTANTS.TRAIN_RAMP_LENGTH,
    carriages: [
      {
        id: 'car_0_lead_ramp',
        type: 'LOCOMOTIVE_RAMP',
        length: 18.0,
        localOffsetZ: 17.2,
        hasRamp: true
      },
      {
        id: 'car_1_mid_coach',
        type: 'PASSENGER_COACH',
        length: 16.0,
        localOffsetZ: 0,
        hasRamp: false
      },
      {
        id: 'car_2_rear_coach',
        type: 'CABOOSE_END',
        length: 16.0,
        localOffsetZ: -17.2,
        hasRamp: false
      }
    ],
    rooftopObstacles: [
      {
        id: 'roof_ac_mid',
        type: 'ROOFTOP_AC_HURDLE',
        localOffsetZ: 0.0, // On center coach
        height: 0.65,
        length: 1.8,
        width: 1.6
      }
    ],
    expectedDuration: {
      at18ms: calculateRooftopDuration(52.4, true, 18.0), // ~3.36s
      at28ms: calculateRooftopDuration(52.4, true, 28.0), // ~2.16s
      at38ms: calculateRooftopDuration(52.4, true, 38.0)  // ~1.59s
    },
    exitType: 'SAFE_DROP'
  },

  // 3. Long 4-Carriage Express Freight/Transit Set (~4.0 - 5.5s roof time at 18 m/s)
  EXPRESS_QUAD_CONSIST: {
    id: 'EXPRESS_QUAD_CONSIST',
    name: 'Quad-Carriage Express Consist',
    tier: 'ADVANCED',
    totalLength: 69.6, // 18m + 1.2m + 16m + 1.2m + 16m + 1.2m + 16m
    gangwayLength: 1.2,
    hasRamp: true,
    hasExitRamp: true,
    rampLength: CONSTANTS.TRAIN_RAMP_LENGTH,
    carriages: [
      {
        id: 'car_0_lead_ramp',
        type: 'LOCOMOTIVE_RAMP',
        length: 18.0,
        localOffsetZ: 25.8,
        hasRamp: true
      },
      {
        id: 'car_1_mid_coach_a',
        type: 'PASSENGER_COACH',
        length: 16.0,
        localOffsetZ: 8.6,
        hasRamp: false
      },
      {
        id: 'car_2_mid_coach_b',
        type: 'PASSENGER_COACH',
        length: 16.0,
        localOffsetZ: -8.6,
        hasRamp: false
      },
      {
        id: 'car_3_rear_coach',
        type: 'LOCOMOTIVE_REAR_RAMP',
        length: 16.0,
        localOffsetZ: -25.8,
        hasRamp: false,
        hasExitRamp: true
      }
    ],
    rooftopObstacles: [
      {
        id: 'roof_ac_car1',
        type: 'ROOFTOP_AC_HURDLE',
        localOffsetZ: 8.6,
        height: 0.65,
        length: 1.8,
        width: 1.6
      },
      {
        id: 'roof_vent_car2',
        type: 'ROOFTOP_VENT',
        localOffsetZ: -8.6,
        height: 0.50,
        length: 1.4,
        width: 1.4
      }
    ],
    expectedDuration: {
      at18ms: calculateRooftopDuration(69.6, true, 18.0, true), // ~4.76s (with front ramp and exit ramp)
      at28ms: calculateRooftopDuration(69.6, true, 28.0, true), // ~3.06s
      at38ms: calculateRooftopDuration(69.6, true, 38.0, true)  // ~2.25s
    },
    exitType: 'END_RAMP'
  },

  // 4. Consecutive Dual Train Gap Hop (Multi-train sequence with reachable gap jump)
  DUAL_TRAIN_GAP_HOP: {
    id: 'DUAL_TRAIN_GAP_HOP',
    name: 'Dual Train Gap Hop Sequence',
    tier: 'ADVANCED',
    totalLength: 67.5, // Train A 32m + Gap 3.5m + Train B 32m
    gangwayLength: 3.5, // Jumpable air gap!
    hasRamp: true,
    hasExitRamp: false,
    rampLength: CONSTANTS.TRAIN_RAMP_LENGTH,
    carriages: [
      {
        id: 'train_a_unit',
        type: 'LOCOMOTIVE_RAMP',
        length: 32.0,
        localOffsetZ: 17.75,
        hasRamp: true
      },
      {
        id: 'train_b_unit',
        type: 'PASSENGER_COACH',
        length: 32.0,
        localOffsetZ: -17.75,
        hasRamp: false
      }
    ],
    rooftopObstacles: [
      {
        id: 'roof_ac_train_b',
        type: 'ROOFTOP_AC_HURDLE',
        localOffsetZ: -12.0,
        height: 0.65,
        length: 1.8,
        width: 1.6
      }
    ],
    expectedDuration: {
      at18ms: calculateRooftopDuration(67.5, true, 18.0), // ~4.19s
      at28ms: calculateRooftopDuration(67.5, true, 28.0), // ~2.70s
      at38ms: calculateRooftopDuration(67.5, true, 38.0)  // ~1.99s
    },
    exitType: 'GAP_JUMP'
  }
};

/**
 * Resolves or builds a speed-adapted train composition to maintain target gameplay duration
 */
export function getCompositionForDifficulty(
  tier: TrainCompositionTier,
  currentSpeed: number = CONSTANTS.INITIAL_SPEED
): TrainCompositionDef {
  if (tier === 'BEGINNER') {
    // Beginner: 2–3s target. At high speeds (>26 m/s), promote to 3-carriage consist
    return currentSpeed > 26.0 ? TRAIN_COMPOSITIONS.METRO_TRIPLE_CONSIST : TRAIN_COMPOSITIONS.COMMUTER_TWIN_SET;
  }
  if (tier === 'INTERMEDIATE') {
    // Intermediate: 3–5s target. At high speeds (>28 m/s), promote to quad consist
    return currentSpeed > 28.0 ? TRAIN_COMPOSITIONS.EXPRESS_QUAD_CONSIST : TRAIN_COMPOSITIONS.METRO_TRIPLE_CONSIST;
  }
  if (tier === 'ADVANCED' || tier === 'EXPERT') {
    // Advanced: 4–7s target with gap jump or quad consist
    return TRAIN_COMPOSITIONS.DUAL_TRAIN_GAP_HOP;
  }
  return TRAIN_COMPOSITIONS.COMMUTER_TWIN_SET;
}

export const COMMUTER_TWIN_SET = TRAIN_COMPOSITIONS.COMMUTER_TWIN_SET;
export const METRO_TRIPLE_CONSIST = TRAIN_COMPOSITIONS.METRO_TRIPLE_CONSIST;
export const EXPRESS_QUAD_CONSIST = TRAIN_COMPOSITIONS.EXPRESS_QUAD_CONSIST;
export const DUAL_TRAIN_GAP_HOP = TRAIN_COMPOSITIONS.DUAL_TRAIN_GAP_HOP;
