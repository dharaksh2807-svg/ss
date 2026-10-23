import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CollectibleType } from './CollectibleFactory';
import { PatternObstacle } from './ObstaclePatterns';

export type CoinPatternArchetype =
  | 'STRAIGHT_TRAIL'
  | 'JUMP_ARC'
  | 'SLIDE_GUIDANCE'
  | 'LANE_SWITCH'
  | 'TRAIN_ROOFTOP'
  | 'RISK_REWARD'
  | 'POST_OBSTACLE'
  | 'JETPACK_AERIAL';

export interface PatternCollectible {
  type: CollectibleType;
  lane: LaneIndex;
  zOffset: number;
  yOffset?: number; // Ground level (0.85), hurdle arch (2.2-2.45), slide (0.60), or train roof (5.20)
  count?: number; // Number of coins in sequence
  spacing?: number; // Spacing in meters between consecutive coins
  isArc?: boolean; // Ballistic parabolic jump arc
  isRampAscent?: boolean; // Ramp incline from ground to rooftop
  endLane?: LaneIndex; // For lane switch trails: smooth interpolation from lane to endLane
  endYOffset?: number; // Optional end height for custom height transitions
  isSlideGuidance?: boolean; // Slide guidance trail positioned at 0.60m
  isRiskRoute?: boolean; // High-risk optional branch offering enhanced reward
  isPostObstacle?: boolean; // Immediate reward burst upon obstacle clearance
  archetype?: CoinPatternArchetype;
}

export interface RiskRewardBranchOptions {
  safeLane: LaneIndex;
  safeZ: number;
  safeCount?: number;
  safeSpacing?: number;
  riskLane: LaneIndex;
  riskZ: number;
  riskCount?: number;
  riskSpacing?: number;
  riskPowerup?: CollectibleType;
  riskPowerupZ?: number;
}

/**
 * CoinPatternLibrary
 * Data-driven generator and validator for physically reachable, balanced,
 * and visually intentional collectible routes across all 8 archetypes.
 */
export class CoinPatternLibrary {
  /**
   * 1. Straight Trail: Aligned along one safe lane at standard running height (0.85m).
   */
  public static createStraightTrail(
    lane: LaneIndex,
    zOffset: number,
    count: number = 6,
    spacing: number = CONSTANTS.COIN_DEFAULT_SPACING,
    yOffset: number = CONSTANTS.COIN_GROUND_Y
  ): PatternCollectible {
    return {
      type: 'COIN',
      lane,
      zOffset,
      yOffset,
      count,
      spacing,
      archetype: 'STRAIGHT_TRAIL'
    };
  }

  /**
   * 2. Jump Arc: Parabolic curve positioned along feasible jump trajectory over a hurdle or gap.
   * Automatically centers the arc apex directly above hurdleZ.
   */
  public static createJumpArc(
    lane: LaneIndex,
    hurdleZ: number,
    count: number = 4,
    spacing: number = CONSTANTS.COIN_ARC_SPACING,
    peakY: number = CONSTANTS.COIN_JUMP_PEAK_Y
  ): PatternCollectible {
    const arcSpan = (count - 1) * spacing;
    const startZ = Math.max(0, hurdleZ - arcSpan / 2);
    return {
      type: 'COIN',
      lane,
      zOffset: Math.round(startZ * 10) / 10,
      yOffset: peakY,
      count,
      spacing,
      isArc: true,
      archetype: 'JUMP_ARC'
    };
  }

  /**
   * 3. Slide Guidance: Low-profile trail (0.60m) leading into, under, and out of a slide obstacle.
   * Telecommunicates the required slide posture without visual ambiguity.
   */
  public static createSlideGuidance(
    lane: LaneIndex,
    barrierZ: number,
    count: number = 5,
    spacing: number = 1.8,
    yOffset: number = CONSTANTS.COIN_SLIDE_Y
  ): PatternCollectible {
    const span = (count - 1) * spacing;
    const startZ = Math.max(0, barrierZ - span / 2);
    return {
      type: 'COIN',
      lane,
      zOffset: Math.round(startZ * 10) / 10,
      yOffset,
      count,
      spacing,
      isSlideGuidance: true,
      archetype: 'SLIDE_GUIDANCE'
    };
  }

  /**
   * 4. Lane-Switch Trail: Smooth S-curve transition between adjacent lanes.
   * Ensures sufficient forward distance for the runner's lane change at current/top speed.
   */
  public static createLaneSwitchTrail(
    startLane: LaneIndex,
    endLane: LaneIndex,
    zOffset: number,
    count: number = 5,
    spacing: number = CONSTANTS.COIN_DEFAULT_SPACING,
    yOffset: number = CONSTANTS.COIN_GROUND_Y
  ): PatternCollectible {
    return {
      type: 'COIN',
      lane: startLane,
      endLane,
      zOffset,
      yOffset,
      count,
      spacing,
      archetype: 'LANE_SWITCH'
    };
  }

  /**
   * 5. Train Rooftop Rewards: Coins arranged on valid rooftop paths safely above train roof geometry (5.20m).
   * Includes ramp incline ascent from 0.85m to 5.20m when hasRamp is true.
   */
  public static createTrainRooftopTrail(
    lane: LaneIndex,
    trainZ: number,
    trainLength: number,
    hasRamp: boolean = false
  ): PatternCollectible[] {
    const collectibles: PatternCollectible[] = [];

    if (hasRamp) {
      // Ascending ramp trail: 4 coins climbing from 0.85m ground height to 5.20m roof height
      collectibles.push({
        type: 'COIN',
        lane,
        zOffset: Math.max(0, trainZ - 1.0),
        yOffset: CONSTANTS.COIN_ROOFTOP_Y,
        count: 4,
        spacing: 2.0,
        isRampAscent: true,
        archetype: 'TRAIN_ROOFTOP'
      });

      // Rooftop spine trail: evenly spaced along the flat train roof past the ramp crest
      const spineStart = trainZ + CONSTANTS.TRAIN_RAMP_LENGTH + 0.5;
      const spineLength = trainLength - (CONSTANTS.TRAIN_RAMP_LENGTH + 1.5);
      const count = Math.max(3, Math.floor(spineLength / 2.2));
      collectibles.push({
        type: 'COIN',
        lane,
        zOffset: Math.round(spineStart * 10) / 10,
        yOffset: CONSTANTS.COIN_ROOFTOP_Y,
        count,
        spacing: 2.2,
        archetype: 'TRAIN_ROOFTOP'
      });
    } else {
      // Stationary roof trail without ramp (accessed via rooftop-to-rooftop vault or powerup)
      const spineStart = trainZ + 2.0;
      const spineLength = trainLength - 4.0;
      const count = Math.max(4, Math.floor(spineLength / 2.2));
      collectibles.push({
        type: 'COIN',
        lane,
        zOffset: Math.round(spineStart * 10) / 10,
        yOffset: CONSTANTS.COIN_ROOFTOP_Y,
        count,
        spacing: 2.2,
        archetype: 'TRAIN_ROOFTOP'
      });
    }

    return collectibles;
  }

  /**
   * 6. Risk/Reward Alternatives: Dual route offering safe passage with modest coins
   * vs. an optional, demanding skill route with enhanced rewards (~1.75x ratio).
   */
  public static createRiskRewardBranch(options: RiskRewardBranchOptions): PatternCollectible[] {
    const collectibles: PatternCollectible[] = [];

    // Safe route: open lane, modest coins
    const safeCount = options.safeCount || 4;
    collectibles.push({
      type: 'COIN',
      lane: options.safeLane,
      zOffset: options.safeZ,
      yOffset: CONSTANTS.COIN_GROUND_Y,
      count: safeCount,
      spacing: options.safeSpacing || CONSTANTS.COIN_DEFAULT_SPACING,
      isRiskRoute: false,
      archetype: 'RISK_REWARD'
    });

    // Risk route: demanding obstacle route, boosted coins (e.g. 7-8 coins)
    const riskCount = options.riskCount || Math.round(safeCount * CONSTANTS.COIN_RISK_REWARD_RATIO);
    collectibles.push({
      type: 'COIN',
      lane: options.riskLane,
      zOffset: options.riskZ,
      yOffset: CONSTANTS.COIN_GROUND_Y,
      count: riskCount,
      spacing: options.riskSpacing || CONSTANTS.COIN_DEFAULT_SPACING,
      isRiskRoute: true,
      archetype: 'RISK_REWARD'
    });

    // Optional bonus powerup or season token on the risk path
    if (options.riskPowerup && options.riskPowerupZ !== undefined) {
      collectibles.push({
        type: options.riskPowerup,
        lane: options.riskLane,
        zOffset: options.riskPowerupZ,
        yOffset: CONSTANTS.COIN_GROUND_Y + 0.15,
        isRiskRoute: true,
        archetype: 'RISK_REWARD'
      });
    }

    return collectibles;
  }

  /**
   * 7. Post-Obstacle Reward: 3-5 coins positioned immediately following the completion
   * of a difficult jump, slide, or evasion to reward player mastery.
   */
  public static createPostObstacleReward(
    lane: LaneIndex,
    obstacleEndZ: number,
    count: number = CONSTANTS.COIN_POST_OBSTACLE_COUNT,
    spacing: number = 1.8
  ): PatternCollectible {
    return {
      type: 'COIN',
      lane,
      zOffset: Math.round((obstacleEndZ + 1.6) * 10) / 10,
      yOffset: CONSTANTS.COIN_GROUND_Y,
      count,
      spacing,
      isPostObstacle: true,
      archetype: 'POST_OBSTACLE'
    };
  }

  /**
   * 8. Jetpack Aerial Trail Metadata & Integration parameters:
   * Guarantees compatibility with AerialCoinManager high-altitude flight curves.
   */
  public static getJetpackAerialTrailInfo(): {
    flightAltitude: number;
    spacing: number;
    safeLandingRunway: number;
    poolSize: number;
  } {
    return {
      flightAltitude: CONSTANTS.JETPACK_ALTITUDE,
      spacing: CONSTANTS.JETPACK_COIN_SPACING,
      safeLandingRunway: CONSTANTS.JETPACK_SAFE_LANDING_RUNWAY,
      poolSize: CONSTANTS.JETPACK_AERIAL_POOL_SIZE
    };
  }

  /**
   * Rigorous Safety & Clearance Validator:
   * Verifies that collectible coins never intersect lethal obstacle geometry
   * (solid train hulls without ramps, side barriers, or impassable boundaries).
   */
  public static validateCollectibleSafety(
    col: PatternCollectible,
    obstacles: PatternObstacle[]
  ): { valid: boolean; reason?: string } {
    const count = col.count || 1;
    const spacing = col.spacing || CONSTANTS.COIN_DEFAULT_SPACING;

    for (let c = 0; c < count; c++) {
      const z = col.zOffset + c * spacing;
      const t = count > 1 ? c / (count - 1) : 0;

      // Determine height at this item
      let y = col.yOffset !== undefined ? col.yOffset : (col.isSlideGuidance ? CONSTANTS.COIN_SLIDE_Y : CONSTANTS.COIN_GROUND_Y);
      if (col.isArc && count > 1) {
        const peak = col.yOffset !== undefined ? col.yOffset : CONSTANTS.COIN_JUMP_PEAK_Y;
        y = CONSTANTS.COIN_GROUND_Y + (peak - CONSTANTS.COIN_GROUND_Y) * 4.0 * t * (1.0 - t);
      } else if (col.isRampAscent && count > 1) {
        const roofY = col.endYOffset !== undefined ? col.endYOffset : (col.yOffset !== undefined ? col.yOffset : CONSTANTS.COIN_ROOFTOP_Y);
        y = CONSTANTS.COIN_GROUND_Y + t * (roofY - CONSTANTS.COIN_GROUND_Y);
      } else if (col.endYOffset !== undefined && count > 1) {
        const startY = col.yOffset !== undefined ? col.yOffset : CONSTANTS.COIN_GROUND_Y;
        y = startY + t * (col.endYOffset - startY);
      }

      // Determine lane at this item
      const lane = col.endLane !== undefined ? (t >= 0.5 ? col.endLane : col.lane) : col.lane;

      // Check against obstacles in this lane
      for (const obs of obstacles) {
        if (obs.lane !== lane) continue;

        const obsStart = obs.zOffset;
        const obsLength = obs.length || (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' ? CONSTANTS.TRAIN_LENGTH_SHORT : 2.0);
        const obsEnd = obsStart + obsLength;

        // Check if within Z bounds
        if (z >= obsStart - 0.2 && z <= obsEnd + 0.2) {
          const isTrain = obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP';
          const hasRamp = !!(obs.hasRamp || obs.type === 'TRAIN_RAMP');

          if (isTrain) {
            if (hasRamp && z <= obsStart + CONSTANTS.TRAIN_RAMP_LENGTH + 0.5) {
              // On ramp: coin must be climbing (y >= 0.85) or ascending
              if (y < 0.75) {
                return {
                  valid: false,
                  reason: `Coin at z=${z.toFixed(1)}m in lane ${lane} is too low on train ramp (y=${y.toFixed(2)}m)`
                };
              }
              continue;
            }

            // On flat train roof: coin must be elevated at roof level (>= 5.0m)
            if (y < 4.8) {
              return {
                valid: false,
                reason: `Lethal placement: Coin at z=${z.toFixed(1)}m in lane ${lane} is inside solid train body (y=${y.toFixed(2)}m, requires y >= 5.0m)`
              };
            }
          } else if (obs.type === 'SIDE_BARRIER') {
            return {
              valid: false,
              reason: `Lethal placement: Coin at z=${z.toFixed(1)}m is placed inside side barrier in lane ${lane}`
            };
          } else if (obs.type === 'HIGH_BARRIER' || obs.type === 'TUNNEL_ARCH') {
            // Must be low enough to slide underneath (y <= 0.75m) or safely elevated if on roof
            if (y > 0.75 && y < 4.0) {
              return {
                valid: false,
                reason: `Coin at z=${z.toFixed(1)}m hits high barrier / tunnel arch overhead (y=${y.toFixed(2)}m, requires y <= 0.75m)`
              };
            }
          }
        }
      }
    }

    return { valid: true };
  }
}
